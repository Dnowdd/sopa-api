import { AppDataSource } from "@/database/data-source";

interface ISessionsRepository {
  getBySessionId: (sid: string) => Promise<any>;
  deleteSession: (sid: string) => Promise<boolean>;
}

export class SessionsRepository implements ISessionsRepository {
  getBySessionId = async (sid: string): Promise<any> => {
    const connection = await AppDataSource.createEntityManager();

    const result = await connection.query(
      "SELECT * FROM sessions WHERE sid = ?",
      [sid],
    );

    if (!result.length) {
      return false;
    }

    return result;
  };

  deleteSession = async (sid: string): Promise<boolean> => {
    try {
      const connection = AppDataSource.createEntityManager();

      await connection.query("DELETE FROM sessions WHERE sid = ?", [sid]);

      return true;
    } catch (error) {
      return false;
    }
  };
}
