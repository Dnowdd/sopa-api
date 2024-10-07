import { AppDataSource } from "@/database/data-source";
import { User } from "@/entity/User";
import { Repository } from "typeorm";

interface IUserCreate
  extends Omit<
    User,
    | "id"
    | "lastLogin"
    | "lastPasswordChange"
    | "createdAt"
    | "updatedAt"
    | "deletedAt"
  > {}

interface IUserRepository {
  create: (user: IUserCreate) => Promise<User>;
  createInstance: (user: Partial<User>) => User;
  getAllPaginated: (
    take: number,
    skip: number,
    search?: string,
  ) => Promise<[User[], number]>;
  getAllByActiveStatusPaginated: (
    take: number,
    skip: number,
    active: boolean,
    search?: string,
  ) => Promise<[User[], number]>;
  getByEmail: (email: string) => Promise<User | null>;
  getById: (id: number) => Promise<User | null>;
  getUserRepository: () => Repository<User>;
  update: (user: User) => Promise<User>;
}

export class UserRepository implements IUserRepository {
  create = async (user: IUserCreate) => {
    const newUser = this.createInstance(user);
    return AppDataSource.manager.save(newUser);
  };

  createInstance = (user: Partial<User>) => {
    return AppDataSource.manager.create(User, user);
  };

  getAllPaginated = (take: number, skip: number, search?: string) => {
    const query = AppDataSource.manager
      .createQueryBuilder(User, "user")
      .andWhere("user.deletedAt IS NULL");

    if (search) {
      query.andWhere(`user.name LIKE :search OR user.email LIKE :search`, {
        search: `%${search}%`,
      });
    }

    query.take(take).skip(skip);

    return query.getManyAndCount();
  };

  getAllByActiveStatusPaginated = (
    take: number,
    skip: number,
    active: boolean,
    search?: string,
  ) => {
    const query = AppDataSource.manager
      .createQueryBuilder(User, "user")
      .where("user.active = :active", { active })
      .andWhere("user.deletedAt IS NULL");

    if (search) {
      query.andWhere(`user.name LIKE :search OR user.email LIKE :search`, {
        search: `%${search}%`,
      });
    }

    query.take(take).skip(skip);

    return query.getManyAndCount();
  };

  getById = (id: number) => {
    return AppDataSource.manager.findOne(User, {
      where: { id, deletedAt: undefined },
    });
  };

  getByEmail = (email: string) => {
    return AppDataSource.manager.findOne(User, {
      where: { email, deletedAt: undefined },
    });
  };

  getUserRepository = () => {
    return AppDataSource.getRepository(User);
  };

  update = async (user: User): Promise<User> => {
    return await AppDataSource.manager.save(user);
  };
}
