import { AuditLog } from "../models/AuditLog.js";
import { immutableHash } from "../utils/hash.js";

export async function writeAuditLog({ recordId = null, action, actor, details }) {
  return AuditLog.create({
    recordId,
    action,
    actor,
    details,
    immutableHash: immutableHash({ recordId, action, actor, details, at: new Date().toISOString() })
  });
}
