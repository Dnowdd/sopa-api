# Template Project - Node.js - Backend

![Node.js](https://img.shields.io/badge/Node.js-green?style=flat&logo=Node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-darkblue?style=flat&logo=TypeScript&logoColor=white)
![Jest](https://img.shields.io/badge/Jest-red?style=flat&logo=Jest&logoColor=white)
![Express](https://img.shields.io/badge/Express-black?style=flat&logo=Express&logoColor=white)
![ESLint](https://img.shields.io/badge/ESLint-purple?style=flat&logo=ESLint&logoColor=white)

O Template Project foi desenvolvido para proporcionar uma estrutura inicial padronizada e eficiente para projetos Node.js. Integrando tecnologias como TypeScript, Express, Jest, ESLint, Prettier e Husky, visa garantir qualidade de código, testes automatizados e práticas de integração contínua.

## Como instalar

Certifique-se de ter o Node.js e NPM instalados em sua máquina

1. Caso você tenha o git instalado, execute este trecho no prompt de comando dentro do diretório desejado:

```bash
git clone https://github.com/Genialogic/node-template-backend.git
```

2. Entre dentro da pasta do projeto:

```bash
cd node-template-backend
```

3. Instale as dependências:

```bash
npm install
```

4. Configure o arquivo `.env`.

5. Por fim, execute o projeto:

```bash
npm run start:dev
```

O projeto estará disponível em http://localhost:3001.

> [!CAUTION]
> Lembre-se de estar com o servidor front-end rodando e apontado no arquivo `.env`.

## Estrutura do projeto

```
node-template-backend/
├── src/
│   ├── api/
│   │   ├── controllers/
│   │   ├── repositories/
│   │   └── services/
│   ├── constants/
│   ├── database/
│   ├── email/
│   ├── entity/
│   ├── middlewares/
│   ├── routes/
│   ├── types/
│   ├── uploads/
│   ├── utils/
│   ├── index.ts
│   └── ...
├── swagger/
├── .env
├── jest.config.js
├── package.json
└── ...
```
