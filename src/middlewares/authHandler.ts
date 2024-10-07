import { UserService } from "@/api/services";
import { Request, Response, NextFunction } from "express";

export const authHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const sessionId = req.headers.authorization;

    if (!sessionId) {
      return res.status(401).send("Unauthorized");
    }

    const userService = new UserService();
    const userSession = await userService.getBySessionId(sessionId);

    if (!userSession.success) {
      return res.status(401).send("Unauthorized");
    }

    req.user = userSession.response;

    next();
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Erro ao capturar dados do usuário",
      error: error.message,
    });
  }
};
