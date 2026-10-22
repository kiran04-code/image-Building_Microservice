import { Router } from "express";
import { createBuild, readBuild ,dummyRoute,dummyRoute2} from "../controller/build.controller.js";

const router = Router();

router.post("/", createBuild);
router.get("/:id", readBuild);
router.get("/dummy", dummyRoute);
router.get("/dummy2", dummyRoute2);

export default router;
