import { Router } from "express";
import { submitFeedback } from "../controllers/feedbackController.js";

export const feedbackRouter = Router();

feedbackRouter.post("/", submitFeedback);
