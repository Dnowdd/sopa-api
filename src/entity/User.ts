import { IsEmail, MaxLength, MinLength } from "class-validator";

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
  CreateDateColumn,
} from "typeorm";

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  @MaxLength(50)
  @MinLength(2, {
    message: "Nome deve ter no mínimo 2 caracteres e no máximo 50 caracteres",
  })
  name!: string;

  @Column()
  @IsEmail(undefined, {
    message: "E-mail inválido",
  })
  email!: string;

  @Column({
    nullable: true,
  })
  avatar?: string;

  @Column({ select: false })
  password!: Buffer;

  @Column({ select: false })
  salt!: Buffer;

  @Column()
  active!: boolean;

  @Column()
  verified!: boolean;

  @Column()
  deleted!: boolean;

  @Column({
    nullable: true,
    name: "last_login",
  })
  lastLogin?: Date;

  @Column({
    nullable: true,
    name: "last_password_change",
  })
  lastPasswordChange?: Date;

  @CreateDateColumn({
    name: "created_at",
  })
  createdAt!: Date;

  @UpdateDateColumn({
    nullable: true,
    name: "updated_at",
  })
  updatedAt?: Date;

  @Column({
    nullable: true,
    name: "deleted_at",
  })
  deletedAt?: Date;
}
