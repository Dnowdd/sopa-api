import * as handlebars from "handlebars";
import * as fs from "fs";
import * as path from "path";

export const emailTemplate = (templateFile: string, replacements: any) => {
  // RESGATA O LOCAL DO ARQUIVO .HTML
  const __dirname = path.resolve();
  const filepath = path.join(__dirname, "src", "email", templateFile);

  // LÊ O ARQUIVO .HTML E TRANFORMA PARA UM STRING
  const source = fs.readFileSync(filepath, "utf-8").toString();
  const template = handlebars.compile(source);

  // SUBSTITUI AS VARIÁVEIS DO ARQUIVO .HTML PELOS VALORES PASSADOS
  const htmlReplaced = template(replacements);

  // MINIFICA O HTML
  const minifiedHtml = htmlReplaced.replace(/\s+/g, " ").trim();

  // RETORNA O HMTL MINIFICADO PARA SER ENVIADO POR E-MAIL
  return minifiedHtml;
};
