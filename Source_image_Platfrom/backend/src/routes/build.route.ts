import { Router } from "express";
import { createBuild, readBuild ,dummyRoute} from "../controller/build.controller.js";

const router = Router();

router.post("/", createBuild);
router.get("/:id", readBuild);
router.get("/dummy", dummyRoute);

export default router;
