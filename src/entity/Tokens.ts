import { Entity, Column, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Tokens {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  type!: string;

  @Column()
  userId!: number;

  @Column()
  code!: string;

  @Column()
  createdAt!: Date;

  @Column()
  expiresAt!: Date;

  @Column()
  active!: boolean;
}
