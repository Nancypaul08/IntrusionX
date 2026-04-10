import { Router } from "express";
import { exportReportPdf, generateReport, listReports } from "../controllers/reportController.js";

export const reportRouter = Router();

reportRouter.get("/", listReports);
reportRouter.post("/", generateReport);
reportRouter.get("/:id/pdf", exportReportPdf);
