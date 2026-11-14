import cors from "cors";
import dotenv from "dotenv";
import express, {} from "express";
import buildRouter from "./routes/build.route.js";
dotenv.config();
const app = express();
const port = Number(process.env.PORT) || 3001;
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.get(["/", "/health", "/api", "/api/health", "/api/index"], (_req, res) => {
    res.json({ status: "ok", message: "Source-to-image service is running." });
});
app.use(["/api/builds", "/builds"], buildRouter);
app.use((req, res) => {
    res.status(404).json({ error: "NOT_FOUND", message: `Cannot ${req.method} ${req.url}` });
});
if (process.env.NODE_ENV !== "test" && !process.env.VERCEL) {
    app.listen(port, () => {
        console.log(`Source-to-image service listening on port ${port}`);
    });
}
export default app;
//# sourceMappingURL=index.js.map