import { UserRepository } from "@/api/repositories";
import { ServiceResponse } from "@/types";
import crypto from "crypto";
import { SessionsRepository } from "../repositories/SessionsRepository";
import { logger } from "@/utils/logger";
import { validate } from "class-validator";
import { ValidateEmail, ValidateName } from "@/utils/validate";

interface IUserCreate {
  name: string;
  email: string;
  avatar?: string;
  password: Buffer;
  repeatPassword: Buffer;
  sessionId: string;
}

interface IUserResponse {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  active: boolean;
  verified: boolean;
  deleted: boolean;
  lastLogin?: Date;
  lastPasswordChange?: Date;
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

type IUpdateUser = Partial<IUserResponse> & {
  password?: string;
};

interface IUserService {
  create: (user: IUserCreate) => Promise<ServiceResponse<IUserResponse>>;
  getAllPaginated: (
    take: number,
    skip: number,
    sessionId: string,
    status?: string,
    search?: string,
  ) => Promise<ServiceResponse<[IUserResponse[], number]>>;
  getById: (
    id: number,
    sessionId: string,
  ) => Promise<ServiceResponse<IUserResponse>>;
  getBySessionId: (
    sessionId?: string,
  ) => Promise<ServiceResponse<IUserResponse>>;
  update: (
    id: number,
    user: IUpdateUser,
    sessionId: string,
  ) => Promise<ServiceResponse<IUserResponse>>;
  delete: (
    id: number,
    sessionId: string,
  ) => Promise<ServiceResponse<IUserResponse>>;
}

export class UserService implements IUserService {
  private userRepository = new UserRepository();
  private sessionsRepository = new SessionsRepository();

  create = async (user: IUserCreate) => {
    try {
      if (!user.name || !user.email || !user.password || !user.repeatPassword) {
        return {
          success: false,
          message: "Preencha todos os campos",
          status: 422,
        };
      }

      const userRepository = this.userRepository.getUserRepository();
      const userValidate = userRepository.create({
        email: user.email,
        name: user.name,
      });
      const errors = await validate(userValidate);

      if (errors.length > 0) {
        return {
          success: false,
          message: "Erro de validação",
          status: 400,
          errors,
        };
      }

      if (user.password !== user.repeatPassword) {
        return {
          success: false,
          message: "As senhas não coincidem",
          status: 406,
        };
      }

      const emailExists = await this.userRepository.getByEmail(user.email);

      if (emailExists) {
        return {
          success: false,
          message: "Email já cadastrado",
          status: 409,
        };
      }

      const userSalt = crypto.randomBytes(16);
      const cryptedPassword = crypto.pbkdf2Sync(
        user.password,
        userSalt,
        310000,
        32,
        "sha256",
      );

      const response = await this.userRepository.create({
        ...user,
        password: cryptedPassword,
        salt: userSalt,
        verified: false,
        active: true,
        deleted: false,
      });

      const { password: _, salt: __, ...responseData } = response;

      const formattedSessionId = `sess:${user.sessionId}`;
      const session =
        await this.sessionsRepository.getBySessionId(formattedSessionId);
      const loggedInUser = JSON.parse(session[0].data).passport.user.id;

      logger.info(`O usuário ID - ${loggedInUser} listou todos os usuários`);

      return {
        success: true,
        message: "Usuário criado com sucesso",
        status: 201,
        response: responseData,
      };
    } catch (error: any) {
      return { success: false, message: error.message, status: 500 };
    }
  };

  getAllPaginated = async (
    take: number = 10,
    skip: number = 0,
    sessionId: string,
    status?: string,
    search?: string,
  ) => {
    const active =
      status === "active" ? true : status === "inactive" ? false : undefined;

    const [users, total] =
      active !== undefined
        ? await this.userRepository.getAllByActiveStatusPaginated(
            take,
            skip,
            active,
            search,
          )
        : await this.userRepository.getAllPaginated(take, skip, search);

    const usersResponse: IUserResponse[] = users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      active: user.active,
      verified: user.verified,
      deleted: user.deleted,
      lastLogin: user.lastLogin,
      lastPasswordChange: user.lastPasswordChange,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      deletedAt: user.deletedAt,
    }));

    const formattedSessionId = `sess:${sessionId}`;
    const session =
      await this.sessionsRepository.getBySessionId(formattedSessionId);
    const loggedInUser = JSON.parse(session[0].data).passport.user.id;

    logger.info(`O usuário ID - ${loggedInUser} listou todos os usuários`);

    return {
      success: true,
      message: "Usuários encontrados",
      status: 200,
      response: [usersResponse, total] as [IUserResponse[], number],
    };
  };

  getById = async (
    id: number,
    sessionId: string,
  ): Promise<ServiceResponse<IUserResponse>> => {
    try {
      if (!id) {
        return {
          success: false,
          message: "ID é obrigatório",
          status: 400,
        };
      }

      const response = await this.userRepository.getById(id);

      if (!response) {
        return {
          success: false,
          message: "Usuário não encontrado",
          status: 404,
        };
      }

      const formattedSessionId = `sess:${sessionId}`;
      const session =
        await this.sessionsRepository.getBySessionId(formattedSessionId);
      const loggedInUser = JSON.parse(session[0].data).passport.user.id;

      logger.info(`O usuário ID - ${loggedInUser} buscou o usuário ID - ${id}`);

      return {
        success: true,
        status: 200,
        message: "Usuário encontrado",
        response,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
        status: error.status || 500,
      };
    }
  };

  getBySessionId = async (
    sessionId?: string,
  ): Promise<ServiceResponse<IUserResponse>> => {
    // Verifica se o sessionId foi passado na requisição
    if (!sessionId) {
      return {
        status: 400,
        success: false,
        message: "Não há uma sessão existente!",
      };
    }

    const formattedSessionId = `sess:${sessionId}`;

    const session =
      await this.sessionsRepository.getBySessionId(formattedSessionId);

    // Verifica se a sessão existe no banco de dados
    if (!session) {
      return {
        success: false,
        message: "Sessão não encontrada",
        status: 404,
      };
    }

    const id = JSON.parse(session[0].data).passport.user.id;
    const sessionData = JSON.parse(session[0].data);
    const sessionExpiration = sessionData.cookie.expires;

    if (new Date(sessionExpiration) < new Date()) {
      return {
        success: false,
        message: "Sessão expirada",
        status: 401,
      };
    }

    const response = await this.userRepository.getById(id);

    // Verifica se o usuário existe no banco de dados
    if (!response) {
      return {
        success: false,
        message: "Usuário não encontrado",
        status: 404,
      };
    }

    logger.info(`O usuário ID - ${response.id} verificou a sessão atual`);

    return {
      success: true,
      status: 200,
      response,
    };
  };

  update = async (
    id: number,
    user: IUpdateUser,
    sessionId?: string,
  ): Promise<ServiceResponse<IUserResponse>> => {
    try {
      if (!id) {
        return {
          success: false,
          message: "ID é obrigatório",
          status: 400,
        };
      }

      const userExists = await this.userRepository.getById(id);

      if (!userExists) {
        return {
          success: false,
          message: "Usuário não encontrado",
          status: 404,
        };
      }

      if (Object.keys(user).length === 0) {
        return {
          success: false,
          message: "Nenhuma informação válida foi passada",
          status: 422,
        };
      }

      if (user.name !== undefined) {
        const nameValidation = new ValidateName();
        nameValidation.name = user.name;

        const errors = await validate(nameValidation);

        if (errors.length > 0) {
          return {
            success: false,
            message: "Erro de validação",
            status: 400,
          };
        }
      }

      if (user.email !== undefined) {
        const emailValidation = new ValidateEmail();
        emailValidation.email = user.email;

        const errors = await validate(emailValidation);

        if (errors.length > 0) {
          return {
            success: false,
            message: "Erro de validação",
            status: 400,
          };
        }
      }

      user.id = userExists.id;
      user.createdAt = userExists.createdAt;
      user.deletedAt = userExists.deletedAt;
      user.deleted = userExists.deleted;
      user.lastLogin = userExists.lastLogin;
      user.lastPasswordChange = userExists.lastPasswordChange;
      user.updatedAt = userExists.updatedAt;

      if (typeof user.active !== "boolean") {
        user.active = userExists.active;
      }

      const { password, ...updatedFields } = user;

      Object.assign(userExists, updatedFields);

      if (password) {
        const userSalt = crypto.randomBytes(16);
        const cryptedPassword = crypto.pbkdf2Sync(
          password,
          userSalt,
          310000,
          32,
          "sha256",
        );

        userExists.password = cryptedPassword;
        userExists.salt = userSalt;
        userExists.lastPasswordChange = new Date();
      }

      userExists.updatedAt = new Date();

      const response = await this.userRepository.update(userExists);

      const formattedSessionId = `sess:${sessionId}`;
      const session =
        await this.sessionsRepository.getBySessionId(formattedSessionId);
      const loggedInUser = JSON.parse(session[0].data).passport.user.id;

      logger.info(
        `O usuário ID - ${loggedInUser} atualizou o usuário ID - ${id}`,
      );

      return {
        success: true,
        status: 200,
        response,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
        status: error.status,
      };
    }
  };

  delete = async (id: number, sessionId: string) => {
    try {
      if (!id) {
        return {
          success: false,
          message: "ID é obrigatório",
          status: 400,
        };
      }

      const userExists = await this.userRepository.getById(id);

      if (!userExists) {
        return {
          success: false,
          message: "Usuário não encontrado",
          status: 404,
        };
      }

      userExists.deleted = true;
      userExists.deletedAt = new Date();

      const response = await this.userRepository.update(userExists);

      const formattedSessionId = `sess:${sessionId}`;
      const session =
        await this.sessionsRepository.getBySessionId(formattedSessionId);
      const loggedInUser = JSON.parse(session[0].data).passport.user.id;

      logger.info(
        `O usuário ID - ${loggedInUser} deletou o usuário ID - ${id}`,
      );

      return {
        success: true,
        status: 200,
        message: "Usuário deletado com sucesso",
        response,
      };
    } catch (error: any) {
      console.log("Error: ", error);
      return {
        success: false,
        message: error.message,
        status: error.status || 500,
      };
    }
  };
}
