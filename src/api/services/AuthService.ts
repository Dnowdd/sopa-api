import {
  AuthRepository,
  TokensRepository,
  UserRepository,
} from "@/api/repositories";
import { User } from "@/entity/User";
import { emailTemplate } from "@/utils/emailTemplate/emailTemplate";
import { logger } from "@/utils/logger";
import crypto from "crypto";
import { Strategy } from "passport-local";
import { SessionsRepository } from "../repositories/SessionsRepository";
import { EmailService } from "./EmailService";
import { UserService } from "./UserService";
import { ServiceResponse } from "@/types";

interface IUserToRegister extends Pick<User, "name" | "email" | "password"> {
  repeatPassword: string;
}

interface IAuthService {
  sendRecoveryEmail: (email: string) => Promise<void>;
  passportStrategy: Strategy;
  sendPasswordUpdateEmail: (email: string) => Promise<void>;
  logout: (sessionId: string) => Promise<ServiceResponse<any>>;
  sendActivationCodeEmail: (
    name: string,
    email: string,
    token: string,
  ) => Promise<void>;
  sendActivationTokenToEmail: (email: string) => Promise<ServiceResponse<void>>;
  createUser: (user: any) => Promise<ServiceResponse<number>>;
  activateUser: (code: string) => Promise<ServiceResponse<void>>;
}

export class AuthService implements IAuthService {
  private userRepository = new UserRepository();
  private tokensRepository = new TokensRepository();
  private sessionRepository = new SessionsRepository();

  private userService = new UserService();

  private async verifyEmailAndGetUser(email: string) {
    // Verifica se o e-mail foi informado
    if (!email) {
      throw new Error("O e-mail é obrigatório");
    }

    const user = await this.userRepository.getByEmail(email);

    // Verifica se o usuário existe
    if (!user) {
      throw new Error("Usuário não encontrado");
    }

    logger.info(`O usuário ID - ${user.id} verificou o email.`);

    return user;
  }

  private async verifyRecoveryCodeAndGetUser(code: string) {
    const recoveryCode = await this.tokensRepository.getTokenCode(
      code,
      "recovery_code",
    );

    if (!recoveryCode) {
      return {
        success: false,
        message: "Código de recuperação inválido",
        status: 400,
      };
    }

    const user = await this.userRepository.getById(recoveryCode.userId);

    if (!user) {
      return {
        success: false,
        message: "Usuário não encontrado",
        status: 404,
      };
    }

    logger.info(
      `O usuário ID - ${user.id} verificou o código de recuperação de senha.`,
    );

    return { user, recoveryCode };
  }

  sendRecoveryEmail = async (email: string): Promise<void> => {
    const user = await this.verifyEmailAndGetUser(email);

    // Gera um código de recuperação
    const recoveryCode = crypto.randomBytes(48).toString("hex");

    const emailService = new EmailService();

    // Informações da empresa
    const companyInfo = {
      company: "Genialogic",
      project: "Template Project",
      footer: "Genialogic, Rua Joanópolis, 648<br>Cidade Jardim - Campinas/SP",
    };

    // Importa o template de e-mail e substitui as variáveis
    const htmlToSend = emailTemplate("default.html", {
      title: "Recuperação de senha",
      name: user.name,
      email: user.email,
      text: `Por favor, <a href="http://localhost:3000/resetar-senha?recoveryCode=${recoveryCode}">clique aqui</a> para redefinir sua senha.<br><br>Caso você não tenha solicitado a recuperação de senha, ignore este e-mail.`,
      ...companyInfo,
    });

    const mailOptions = {
      from: '"Genialogic" <no-reply@genialogic.com.br>',
      to: email,
      subject: "Recuperação de senha",
      text: ``,
      html: htmlToSend,
    };

    await emailService.sendEmail(mailOptions);

    logger.info(`O usuário ID - ${user.id} solicitou a recuperação de senha.`);

    // Tempo de expiração do código de recuperação de 2 horas
    const expiration = 2 * 60 * 60 * 1000;

    // Salva o código de recuperação no banco de dados
    await this.tokensRepository.createTokenCode(
      user.id,
      recoveryCode,
      "recovery_code",
      expiration,
    );

    return;
  };

  resetPassword = async (
    code: string,
    newPassword: string,
    confirmNewPassword: string,
  ) => {
    try {
      if (!newPassword || !confirmNewPassword) {
        return {
          success: false,
          message: "As senhas não podem ser vazias",
          status: 400,
        };
      }

      if (newPassword !== confirmNewPassword) {
        return {
          success: false,
          message: "As senhas não coincidem",
          status: 400,
        };
      }

      const verificationResult = await this.verifyRecoveryCodeAndGetUser(code);

      if (!verificationResult || !verificationResult.user) {
        return {
          success: false,
          message: "Código de recuperação inválido",
          status: 400,
        };
      }

      const { user, recoveryCode } = verificationResult;

      const userSalt = crypto.randomBytes(16);
      const cryptedPassword = crypto.pbkdf2Sync(
        newPassword,
        userSalt,
        310000,
        32,
        "sha256",
      );

      user.password = cryptedPassword;
      user.salt = userSalt;
      user.lastPasswordChange = new Date();
      user.updatedAt = new Date();

      await this.userRepository.update(user);

      recoveryCode!.active = false;
      await this.tokensRepository.updateTokenCode(recoveryCode!);
      await this.sendPasswordUpdateEmail(user.email);

      logger.info(`O usuário ID - ${user.id} resetou a senha.`);

      return {
        success: true,
        message: "Senha atualizada com sucesso",
        status: 200,
      };
    } catch (error: any) {
      return {
        success: false,
        message: "Erro ao resetar a senha.",
        error: error.message,
        status: 500,
      };
    }
  };

  activateUser = async (code: string) => {
    try {
      // Pega os valores na tabela de tokens, referente ao código de ativação
      const getToken = await this.tokensRepository.getTokenCode(
        code,
        "activation_code",
      );

      // Verifica se o código de ativação existe
      if (!getToken) {
        return {
          success: false,
          message: "Código de ativação inválido",
          status: 400,
        };
      }

      // Verifica se o código de ativação está ativo/expirado
      if (getToken.expiresAt < new Date()) {
        return {
          success: false,
          message: "Código de ativação expirado",
          status: 400,
        };
      }

      // Desativa o código de ativação
      getToken.active = false;

      // Atualiza o código de ativação no banco de dados
      await this.tokensRepository.updateTokenCode(getToken);

      // Atualiza o usuário no banco de dados para ativo
      await this.userService.update(getToken.userId, {
        verified: true,
      });

      return {
        success: true,
        message: "O usuário foi ativo com sucesso",
        status: 200,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
        status: 500,
      };
    }
  };

  sendPasswordUpdateEmail = async (email: string): Promise<void> => {
    const user = await this.verifyEmailAndGetUser(email);

    const emailService = new EmailService();

    // Informações da empresa
    const companyInfo = {
      company: "Genialogic",
      project: "Template Project",
      footer: "Genialogic, Rua Joanópolis, 648<br>Cidade Jardim - Campinas/SP",
    };

    // Importa o template de e-mail e substitui as variáveis
    const htmlToSend = emailTemplate("default.html", {
      title: "Atualização de senha",
      name: user.name,
      email: user.email,
      text: `Sua senha foi atualizada com sucesso!<br><br>Caso você não tenha solicitado a recuperação de senha, entre em contato com o suporte.<br><br>Atenciosamente, Genialogic.</p>`,
      ...companyInfo,
    });

    const mailOptions = {
      from: '"Genialogic" <no-reply@genialogic.com.br>',
      to: email,
      subject: "Atualização de senha",
      text: ``,
      html: htmlToSend,
    };

    await emailService.sendEmail(mailOptions);

    return;
  };

  // prettier-ignore
  passportStrategy = new Strategy({usernameField: 'email'},async function verify(email, password, cb) {
    try {
      const authRepository = new AuthRepository()
      const user = await authRepository.login(email)
  
      if (!user) { return cb(null, false, { message: 'Incorrect email or password.' }); }
  
      crypto.pbkdf2(password, user.salt!, 310000, 32, 'sha256', function(err, hashedPassword) {
        if (err) {
          return cb(err);
        }
        if(!user.password) {
          return cb(null, false, { message: 'User not allowed' });
        }
        if(!user.active) {
          return cb(null, false, { message: 'User not allowed' });
        }
        if(!user.verified) {
          return cb(null, false, { message: 'User not allowed' });
        }
        if (!crypto.timingSafeEqual(user.password, hashedPassword)) {
          return cb(null, false, { message: 'Incorrect email or password.' });
        }
        const {password: _password, salt: _salt, ...result} = user
  
        authRepository.updateLastLogin(result.id)

        logger.info(`O usuário ID - ${result.id} logou no sistema.`);
  
        return cb(null, result);
      });
    } catch (error) {
      console.log('Strategy error', error)
      if (error) {
          return cb(error);
      }
    }
  })

  logout = async (sessionId: string) => {
    try {
      if (!sessionId) {
        return {
          success: false,
          message: "Sessão não informada",
          status: 400,
        };
      }

      const response = await this.sessionRepository.deleteSession(sessionId);

      if (!response) {
        return {
          success: false,
          message: "Essa sessão não existe.",
          status: 401,
        };
      }

      return {
        success: true,
        message: "Usuário deslogado com sucesso",
        status: 200,
      };
    } catch (error: any) {
      return {
        success: false,
        message: "Erro ao deslogar usuário",
        response: error.message,
        status: 500,
      };
    }
  };

  sendActivationCodeEmail = async (
    name: string,
    email: string,
    token: string,
  ): Promise<void> => {
    const emailService = new EmailService();

    // Informações da empresa
    const companyInfo = {
      company: "Genialogic",
      project: "Template Project",
      footer: "Genialogic, Rua Joanópolis, 648<br>Cidade Jardim - Campinas/SP",
    };

    // Importa o template de e-mail e substitui as variáveis
    const htmlToSend = emailTemplate("default.html", {
      title: "Ativar Conta",
      name,
      email,
      text: `Sua conta foi criada com sucesso, para usufruir de todos os benefícios, ative sua conta clicando <a href="http://localhost:3000/ativar-conta?token=${token}">aqui</a>.<br><br>Caso você não tenha solicitado o token de ativação de conta, entre em contato com o suporte.<br><br>Atenciosamente, Genialogic.</p>`,
      ...companyInfo,
    });

    const mailOptions = {
      from: '"Genialogic" <no-reply@genialogic.com.br>',
      to: email,
      subject: "Ative sua conta",
      text: ``,
      html: htmlToSend,
    };

    await emailService.sendEmail(mailOptions);

    return;
  };

  sendActivationTokenToEmail = async (
    email: string,
  ): Promise<ServiceResponse<void>> => {
    try {
      // Busca o usuário pelo e-mail
      const user = await this.userRepository.getByEmail(email);

      // Verifica se o usuário existe
      if (!user) {
        return {
          success: false,
          message: "Usuário não encontrado",
          status: 404,
        };
      }

      // Cria um código de ativação
      const activationCode = crypto.randomBytes(48).toString("hex");

      const expiration =
        parseFloat(process.env.TIME_REGISTER_VERIFICATION || "0") * 1000;

      // Salva o código de ativação no banco de dados
      await this.tokensRepository.createTokenCode(
        user.id,
        activationCode,
        "activation_code",
        expiration,
      );

      // Envia o e-mail
      await this.sendActivationCodeEmail(user.name, email, activationCode);

      return {
        success: true,
        message: "O E-mail com o token de verificação foi enviado com sucesso!",
        status: 200,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
        status: 500,
      };
    }
  };

  createUser = async ({
    name,
    email,
    password,
    repeatPassword,
  }: IUserToRegister) => {
    try {
      // Verifica se todos os campos foram informados
      if (!name || !email || !password || !repeatPassword) {
        return {
          success: false,
          message: "Preencha todos os campos!",
          status: 400,
        };
      }

      // Verifica se as senhas conferem
      if (password.toString("utf-8") !== repeatPassword) {
        return {
          success: false,
          message: "As senhas não conferem!",
          status: 400,
        };
      }

      // Busca o usuário pelo e-mail
      const user = await this.userRepository.getByEmail(email);

      // Verifica se o e-mail já está cadastrado
      if (user) {
        return {
          success: false,
          message: "O endereço de e-mail já está cadastrado",
          status: 400,
        };
      }

      // Gera um salt para a senha
      const userSalt = crypto.randomBytes(16);

      // Gera um hash da senha
      const cryptedPassword = crypto.pbkdf2Sync(
        password,
        userSalt,
        310000,
        32,
        "sha256",
      );

      // Cria o usuário
      const userRepository = new UserRepository();
      const creationResult = await userRepository.create({
        active: true,
        verified: false,
        email,
        name,
        password: cryptedPassword,
        avatar: "",
        salt: userSalt,
        deleted: false,
      });

      // Salva no log
      logger.info(`Usuário ${name} foi criado.`);

      // Envia o e-mail de ativação
      await this.sendActivationTokenToEmail(email);

      return { success: true, response: creationResult.id, status: 201 };
    } catch (error: any) {
      return { success: false, message: error.message, status: 500 };
    }
  };
}
