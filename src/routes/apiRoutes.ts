import { AuthController, UserController } from "@/api/controllers";
import { authHandler } from "@/middlewares/authHandler";
import { Router } from "express";

export const apiRoutes = Router();

apiRoutes.use("/auth", AuthController);
apiRoutes.use("/user", authHandler, UserController);
