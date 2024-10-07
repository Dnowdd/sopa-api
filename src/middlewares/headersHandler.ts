import { Request, Response, NextFunction } from "express";

const allowedMethods = ["GET", "POST", "OPTIONS", "PUT", "PATCH", "DELETE"];

const verifyRequestMethods = (req: Request) => {
  if (req.method === "OPTIONS") {
    return 200;
  } else if (!allowedMethods.includes(req.method)) {
    return 401;
  }
  return null;
};

export const headersHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  console.log("Request URL:", req.originalUrl);
  console.log("Request Origin", req.headers.origin);
  res.header("Access-Control-Allow-Origin", req.headers.origin);
  // Request methods you wish to allow
  res.setHeader("Access-Control-Allow-Methods", allowedMethods.join());

  // Request headers you wish to allow
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-Requested-With,content-type,authorization,sessionid",
  );

  const shouldBlock = verifyRequestMethods(req);
  if (shouldBlock) return res.sendStatus(shouldBlock);

  next();
};
