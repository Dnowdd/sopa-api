import { IsNotEmpty, MinLength, MaxLength } from "class-validator";

export class ValidateName {
  @IsNotEmpty({ message: "O nome não pode ser vazio" })
  @MinLength(2, {
    message: "O nome deve ter no mínimo 2 caracteres",
  })
  @MaxLength(50, {
    message: "O nome deve ter no máximo 50 caracteres",
  })
  name!: string;
}
