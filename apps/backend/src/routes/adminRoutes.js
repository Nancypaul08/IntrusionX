import { Router } from "express";
import { getRules, syncRules, updateRule } from "../controllers/adminController.js";
import { requireRole } from "../middleware/auth.js";

export const adminRouter = Router();

adminRouter.get("/rules", requireRole("admin"), getRules);
adminRouter.get("/rules/sync", requireRole("admin"), syncRules);
adminRouter.put("/rules/:ruleId", requireRole("admin"), updateRule);
