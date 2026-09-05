import cors from "cors";
import dotenv from "dotenv";
import express, { type Request, type Response } from "express";
import buildRouter from "./routes/build.route.js";

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 3001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", message: "Source-to-image service is running." });
});

app.use("/api/builds", buildRouter);

app.listen(port, () => {
  console.log(`Source-to-image service listening on port ${port}`);
});
