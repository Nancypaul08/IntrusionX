import { AuditLog } from "../models/AuditLog.js";
import { IngestionRecord } from "../models/IngestionRecord.js";

export async function getLogs(req, res) {
  const [records, auditLogs] = await Promise.all([
    IngestionRecord.find().sort({ createdAt: -1 }).limit(50),
    AuditLog.find().sort({ createdAt: -1 }).limit(100)
  ]);

  return res.json({ records, auditLogs });
}
