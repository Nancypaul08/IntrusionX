import { Rule } from "../models/Rule.js";
import { fetchRulesFromAi, syncRulesToAi } from "../services/aiService.js";
import { writeAuditLog } from "../services/auditService.js";

export async function getRules(req, res) {
  const rules = await Rule.find().sort({ createdAt: 1 });
  return res.json(rules);
}

export async function syncRules(req, res) {
  const aiRules = await fetchRulesFromAi();
  return res.json(aiRules);
}

export async function updateRule(req, res) {
  const rule = await Rule.findOneAndUpdate({ ruleId: req.params.ruleId }, req.body, { new: true });
  if (!rule) {
    return res.status(404).json({ message: "Rule not found" });
  }

  const rules = await Rule.find().sort({ createdAt: 1 }).lean();
  await syncRulesToAi(rules);
  await writeAuditLog({
    action: "rule.update",
    actor: req.user.email,
    details: { ruleId: rule.ruleId, enabled: rule.enabled, severity: rule.severity }
  });
  return res.json(rule);
}
