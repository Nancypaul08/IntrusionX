import { Router } from "express";
import { ingestBatch, ingestRecord } from "../controllers/ingestionController.js";

export const ingestionRouter = Router();

ingestionRouter.post("/", ingestRecord);
ingestionRouter.post("/batch", ingestBatch);
