import { Request, Response, NextFunction } from "express";

export const errorHandler = (
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): Express.Response => {
  console.log("Erro no server", error);
  return res.status(500).send(error.message);
};
