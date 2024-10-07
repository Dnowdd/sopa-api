import { IsEmail } from "class-validator";

export class ValidateEmail {
  @IsEmail({}, { message: "E-mail inválido" })
  email!: string;
}
