import { Router } from "express";
import { acknowledgeAlert, getAlerts } from "../controllers/alertController.js";

export const alertRouter = Router();

alertRouter.get("/", getAlerts);
alertRouter.patch("/:id/acknowledge", acknowledgeAlert);
