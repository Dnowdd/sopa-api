import "dotenv/config";
import express, { Express } from "express";
import session from "express-session";
import sqliteStoreFactory from "express-session-sqlite";
import passport from "passport";
import path from "path";
import * as sqlite3 from "sqlite3";
import { errorHandler, headersHandler } from "./middlewares";
import { router } from "./routes/index";
import { AppDataSource } from "./database/data-source";

const PORT = process.env.SERVER_PORT;
const eightHours = 3600000 * 8;
const SqliteStore = sqliteStoreFactory(session);
const sess = {
  secret: process.env.SESSION_SECRET,
  cookie: {
    maxAge: eightHours,
  } as any,
  resave: false,
  unset: "destroy",
  saveUninitialized: false,
  store: new SqliteStore({
    // Database library to use. Any library is fine as long as the API is compatible
    // with sqlite3, such as sqlite3-offline
    driver: sqlite3.Database,
    // for in-memory database
    // path: ':memory:'
    path: path.resolve(__dirname, "..", "db.sqlite"),
    // Session TTL in milliseconds
    ttl: 1234,
    // (optional) Session id prefix. Default is no prefix.
    prefix: "sess:",
    // (optional) Adjusts the cleanup timer in milliseconds for deleting expired session rows.
    // Default is 5 minutes.
    cleanupInterval: eightHours,
  }),
};

AppDataSource.initialize()
  .then(() => {
    const app: Express = express();

    if (app.get("env") === "production") {
      app.set("trust proxy", 1); // trust first proxy
      sess.cookie.secure = true; // serve secure cookies
    }

    app.use(session(sess as any));
    app.use(passport.session());
    app.use(express.json());
    app.use(headersHandler);
    app.use(router);
    app.use(errorHandler);

    app.listen(PORT, () =>
      console.log(`🔥 Server is running on http://localhost:${PORT}`),
    );
  })
  .catch((error) => console.log(error));
