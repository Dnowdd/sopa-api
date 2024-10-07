import winston from "winston";
// import SqlTransport from "winston-sql-transport";

// const transportConfig = {
//   client: "mssql",
//   connection: {
//     user: "MSSQL_USER",
//     password: "MSSQL_PASSWORD",
//     server: "MSSQL_HOST",
//     database: "MSSQL_DB",
//   },
// };

export const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    // winston.format.json(), Format the logs in JSON
    winston.format.printf(
      (info) => `${info.timestamp} ${info.level}: ${info.message}`,
    ),
  ),
  transports: [
    new winston.transports.File({
      filename: "logs/fileLogs.log",
    }),
    // new SqlTransport(transportConfig),
  ],
});
