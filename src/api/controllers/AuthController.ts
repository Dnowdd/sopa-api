import { AuthService } from "@/api/services";
import { User } from "@/entity/User";
import express from "express";
import passport from "passport";

const router = express.Router();
const authService = new AuthService();
passport.use(new AuthService().passportStrategy);

passport.serializeUser(function (user, cb) {
  process.nextTick(function () {
    const { password: _password, ...userWithoutPassword } = user as User;

    cb(null, userWithoutPassword);
  });
});

passport.deserializeUser(function (user, cb) {
  process.nextTick(function () {
    return cb(null, user as User);
  });
});

router.post("/register", async function (req, res) {
  const { name, email, password, repeatPassword } = req.body;

  try {
    const createUser = await authService.createUser({
      name,
      email,
      password,
      repeatPassword,
    });

    res.status(createUser.status).json(createUser);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Erro ao criar usuário",
      error: error.message,
    });
  }
});

router.patch("/register-confirm", async (req, res) => {
  try {
    const { token } = req.body;

    const response = await authService.activateUser(token);

    res.status(response.status).json(response);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Erro ao confirmar usuário",
      error: error.message,
    });
  }
});

router.post("/send-confirm-email", async (req, res) => {
  try {
    const { email } = req.body;

    const response = await authService.sendActivationTokenToEmail(email);

    res.status(response.status).json(response);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Erro ao enviar e-mail de confirmação",
      error: error.message,
    });
  }
});

router.post("/login", passport.authenticate("local"), function (req, res) {
  if (!req.user) return res.status(401);
  res.send({ user: req.user, sessionId: req.sessionID });
});

router.post("/password-recovery", async function (req, res) {
  const { email } = req.body;

  try {
    // Verifica se o e-mail foi informado
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "E-mail não informado",
      });
    }

    // Gera um código de recuperação, envia para o e-mail e salva no banco de dados
    await authService.sendRecoveryEmail(email);

    res.status(200).json({
      success: true,
      message: "E-mail de recuperação enviado com sucesso!",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Erro ao enviar e-mail de recuperação",
      error: error.message,
    });
  }
});

router.put("/reset-password/:code", async function (req, res) {
  const { code } = req.params;
  const { newPassword, confirmNewPassword } = req.body;

  try {
    const response = await authService.resetPassword(
      code,
      newPassword,
      confirmNewPassword,
    );

    res.status(response.status).json({
      success: response.success,
      message: response.message,
      error: response.error,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Erro ao resetar a senha",
      error: error.message,
    });
  }
});

router.get("/logout", async function (req, res, next) {
  const sessionId = req.headers.authorization;
  const formattedSessionId = `sess:${sessionId}`;

  const response = await authService.logout(formattedSessionId);

  req.logout(function (err) {
    if (err) {
      return next(err);
    }

    req.session.destroy(function (err) {
      // cannot access session here
      console.log(err ?? "Logout com sucesso");
    });
  });

  res.status(response.status).json({
    success: response.success,
    message: response.message,
    error: response.response,
  });
});

export { router as AuthController };
