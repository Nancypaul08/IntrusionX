import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    recordId: { type: String, default: null },
    action: { type: String, required: true },
    actor: { type: String, required: true },
    details: { type: mongoose.Schema.Types.Mixed, default: {} },
    immutableHash: { type: String, required: true }
  },
  { timestamps: true }
);

export const AuditLog = mongoose.model("AuditLog", auditLogSchema);
