import express from "express";
import cors from "cors";
import path from "node:path";
import rateLimit from "express-rate-limit";
import { env } from "./config/env.js";
import { createLocalJsonStore } from "./storage/callStore.js";
export const createServer = () => {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(
    rateLimit({
      windowMs: 60_000,
      limit: 60,
      standardHeaders: true,
      legacyHeaders: false
    })
  );

  const store = createLocalJsonStore(env.callLogFile);

  const publicPath = path.resolve("public");
  app.use(express.static(publicPath));
  app.get("/", (_req, res) => {
    res.sendFile(path.join(publicPath, "index.html"));
  });

  return { app, store };
};
