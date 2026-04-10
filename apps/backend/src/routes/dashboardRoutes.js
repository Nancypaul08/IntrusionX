import { Router } from "express";
import { getRiskScores, getSummary } from "../controllers/dashboardController.js";

export const dashboardRouter = Router();

dashboardRouter.get("/summary", getSummary);
dashboardRouter.get("/risks", getRiskScores);
