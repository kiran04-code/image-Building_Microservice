import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { readServiceStatus } from "./controller/health.controller.js";
import buildRouter from "./routes/build.route.js";

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 3001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", readServiceStatus);
app.get("/health", readServiceStatus);

app.use("/api/builds", buildRouter);

if (process.env.NODE_ENV !== "test" && !process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`Source-to-image service listening on port ${port}`);
  });
}

export default app;
