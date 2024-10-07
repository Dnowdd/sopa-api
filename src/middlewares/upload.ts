import multer, { FileFilterCallback } from "multer";
import path from "path";
import { Request } from "express";

const IS_PRODUCTION = process.env.NODE_ENV === "production";

const AVATAR_DESTINATION = IS_PRODUCTION
  ? "dist/uploads/avatars"
  : "src/uploads/avatars";

const storage = multer.diskStorage({
  destination: (req, res, callback) => {
    callback(null, AVATAR_DESTINATION);
  },
  filename: (req, file, callback) => {
    const time = new Date().getTime();

    callback(null, `${time}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  callback: FileFilterCallback,
) => {
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];

  if (allowedTypes.includes(file.mimetype)) {
    callback(null, true);
  } else {
    callback(null, false);
  }
};

export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 1024 * 1024 * 5, // 5MB
  },
});
