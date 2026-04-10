import { Router } from "express";
import { getLogs } from "../controllers/logController.js";

export const logRouter = Router();

logRouter.get("/", getLogs);
