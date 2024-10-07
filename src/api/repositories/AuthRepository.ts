import { AppDataSource } from "@/database/data-source";
import { User } from "@/entity/User";

interface ICAuthRepository {
  login: (email: string) => Promise<User | null>;
  updateLastLogin: (id: number) => Promise<void>;
}

export class AuthRepository implements ICAuthRepository {
  login = async (email: string) => {
    const query = AppDataSource.manager
      .createQueryBuilder(User, "user")
      .select("*")
      .where("user.email = :email", { email });
    const user = query.getRawOne();

    return user;
  };

  updateLastLogin = async (id: number) => {
    await AppDataSource.manager.update(User, id, {
      lastLogin: new Date(),
    });
  };
}
