import { UserService } from "@/api/services";
import { paginationHandler } from "@/middlewares";
import { upload } from "@/middlewares/upload";
import express from "express";

const router = express.Router();
const userService = new UserService();
const IS_PRODUCTION = process.env.NODE_ENV === "production";
const PROD_AVATAR_PATH = "dist/uploads/avatars";
const DEV_AVATAR_PATH = "src/uploads/avatars";
const AVATAR_PATH = IS_PRODUCTION ? PROD_AVATAR_PATH : DEV_AVATAR_PATH;

router.post("/create", upload.single("avatar"), async (req, res) => {
  try {
    const body = req.body;
    const avatar = req.file?.filename;
    const sessionId = req.headers.authorization as string;

    const response = await userService.create({
      ...body,
      avatar,
      sessionId,
    });

    res.header("Location", response.toString());
    return res.status(response.status || 201).json(response);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Erro interno ao criar usuário",
      error: error.message,
    });
  }
});

router.use("/avatar", express.static(AVATAR_PATH));

router.get("/all", async (req, res) => {
  try {
    const take: number = Number(req.query.limit) || 10;
    const skip: number = (Number(req.query.page) || 1) * take - take;
    const search = req.query.search || "";
    const sessionId = req.headers.authorization as string;

    const response = await paginationHandler(req, () =>
      userService.getAllPaginated(
        take,
        skip,
        sessionId,
        req.query.status as string,
        search as string,
      ),
    );

    res.status(response.status).send(response.data);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Erro interno ao buscar usuários",
      error: error.message,
    });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const sessionId = req.headers.authorization as string;

    const response = await userService.getById(parseInt(id), sessionId);

    return res.status(response.status).json(response);
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Erro interno ao buscar usuário",
      error: error.message,
    });
  }
});

router.patch("/:id", upload.single("avatar"), async (req, res) => {
  try {
    const {
      body,
      params: { id },
    } = req;
    const avatar = req.file?.filename;
    const sessionId = req.headers.authorization as string;

    const response = await userService.update(
      parseInt(id),
      { ...body, avatar },
      sessionId,
    );

    return res.status(response.status).json(response);
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Erro interno ao atualizar usuário",
      error: error.message,
    });
  }
});

router.get("/", async (req, res) => {
  const sessionId = req.headers.authorization;

  const response = await userService.getBySessionId(sessionId);

  return res.status(response.status).json(response.response);
});

router.get("/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const sessionId = req.headers.authorization as string;

    const parsedId = parseInt(id);
    const response = await userService.delete(parsedId, sessionId);

    return res.status(response.status).json(response);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Erro interno ao deletar usuário",
      error: error.message,
    });
  }
});

export { router as UserController };
