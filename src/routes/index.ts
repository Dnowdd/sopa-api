import { Router } from "express";
import { apiRoutes } from "./apiRoutes";
import { swaggerRoutes } from "./swaggerRoutes";

export const router = Router();

router.use("/api", apiRoutes, swaggerRoutes);
