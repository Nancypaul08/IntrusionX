import { IngestionRecord } from "../models/IngestionRecord.js";
import { analyzeBatch, analyzeRecord } from "../services/aiService.js";
import { createAlert } from "../services/alertService.js";
import { writeAuditLog } from "../services/auditService.js";
import { broadcast } from "../services/socketService.js";

function mergePayload(input, analysis) {
  return {
    recordId: analysis.recordId,
    sourceType: input.sourceType,
    sourceName: input.sourceName,
    owner: input.owner,
    region: input.region,
    actorId: input.actorId,
    content: input.content,
    tags: input.tags || [],
    metadata: input.metadata || {},
    normalizedContent: analysis.normalizedContent,
    encryptedContent: analysis.encryptedContent,
    piiMatches: analysis.piiMatches,
    sensitiveEntities: analysis.sensitiveEntities,
    classification: analysis.classification,
    unauthorizedAccessDetected: analysis.unauthorizedAccessDetected,
    exposureDetected: analysis.exposureDetected,
    complianceStatus: analysis.complianceStatus,
    ruleOutcomes: analysis.ruleOutcomes,
    riskScore: analysis.riskScore,
    remediation: analysis.remediation
  };
}

async function handleAlerts(savedRecord) {
  if (savedRecord.complianceStatus === "Violation") {
    await createAlert({
      title: "Compliance violation detected",
      message: `${savedRecord.recordId} triggered a policy violation`,
      severity: savedRecord.riskScore.toLowerCase(),
      recordRef: savedRecord._id
    });
  } else if (savedRecord.riskScore !== "Low") {
    await createAlert({
      title: "Elevated risk detected",
      message: `${savedRecord.recordId} flagged as ${savedRecord.riskScore} risk`,
      severity: savedRecord.riskScore.toLowerCase(),
      recordRef: savedRecord._id
    });
  }
}

export async function ingestRecord(req, res) {
  const analysis = await analyzeRecord(req.body);
  const savedRecord = await IngestionRecord.create(mergePayload(req.body, analysis));

  await handleAlerts(savedRecord);
  await writeAuditLog({
    recordId: savedRecord.recordId,
    action: "ingestion.single",
    actor: req.user.email,
    details: { complianceStatus: savedRecord.complianceStatus, riskScore: savedRecord.riskScore }
  });

  broadcast("dashboard:update", { recordId: savedRecord.recordId });
  return res.status(201).json(savedRecord);
}

export async function ingestBatch(req, res) {
  const records = req.body.records || [];
  const analysisResponse = await analyzeBatch(records);
  const merged = records.map((item, index) => mergePayload(item, analysisResponse.results[index]));
  const savedRecords = await IngestionRecord.insertMany(merged);

  for (const record of savedRecords) {
    await handleAlerts(record);
    await writeAuditLog({
      recordId: record.recordId,
      action: "ingestion.batch",
      actor: req.user.email,
      details: { complianceStatus: record.complianceStatus, riskScore: record.riskScore }
    });
  }

  broadcast("dashboard:update", { batchCount: savedRecords.length });
  return res.status(201).json(savedRecords);
}
