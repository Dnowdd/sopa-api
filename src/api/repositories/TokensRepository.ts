import { AppDataSource } from "@/database/data-source";
import { Tokens } from "@/entity/Tokens";

interface ITokensRepository {
  createTokenCode: (
    userId: number,
    code: string,
    type: string,
    expiration: number,
  ) => Promise<Tokens>;
  getTokenCode: (code: string, type: string) => Promise<Tokens | null>;
  updateTokenCode: (activationCode: Tokens) => Promise<void>;
}

export class TokensRepository implements ITokensRepository {
  createTokenCode = async (
    userId: number,
    code: string,
    type: string,
    expiration: number,
  ) => {
    if (!userId || !code) {
      throw new Error(
        "userId e code são obrigatórios para criar um código de recuperação",
      );
    }

    // Adiciona um novo código de recuperação ao banco de dados
    const tokenCode = new Tokens();
    tokenCode.userId = userId;
    tokenCode.type = type;
    tokenCode.code = code;
    tokenCode.createdAt = new Date();
    tokenCode.expiresAt = new Date(Date.now() + expiration);
    tokenCode.active = true;

    return AppDataSource.manager.save(tokenCode);
  };

  getTokenCode = async (code: string, type: string) => {
    return AppDataSource.manager.findOne(Tokens, {
      where: { code, type, active: true },
    });
  };

  updateTokenCode = async (tokenCode: Tokens) => {
    await AppDataSource.manager.save(tokenCode);
  };
}
