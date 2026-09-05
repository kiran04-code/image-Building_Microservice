import { Router } from "express";
import { createBuild, readBuild } from "../controller/build.controller.js";
const router = Router();
router.post("/", createBuild);
router.get("/:id", readBuild);
export default router;
//# sourceMappingURL=build.route.js.map