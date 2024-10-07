import { Router } from "express";
import swaggerUi from "swagger-ui-express";
import swaggerDocument from "../../swagger/swagger.json";
import path from "path";

export const swaggerRoutes = Router();

swaggerRoutes.use(
  "/swagger-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument),
);

swaggerRoutes.get("/swagger-json", (_, res) => {
  const swaggerJsonPath = path.resolve(process.cwd(), "swagger/swagger.json");
  return res.sendFile(swaggerJsonPath);
});

swaggerRoutes.get("/swagger", (_, res) => {
  const indexPath = path.resolve(process.cwd(), "swagger/index.html");
  return res.sendFile(indexPath);
});
