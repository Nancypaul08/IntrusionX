import { submitFeedbackToAi } from "../services/aiService.js";
import { writeAuditLog } from "../services/auditService.js";

export async function submitFeedback(req, res) {
  const response = await submitFeedbackToAi(req.body);
  await writeAuditLog({
    recordId: req.body.recordId,
    action: "feedback.submit",
    actor: req.user.email,
    details: { label: req.body.label }
  });
  return res.status(201).json(response);
}
