import { ComplianceReport } from "../models/ComplianceReport.js";
import { IngestionRecord } from "../models/IngestionRecord.js";
import { buildSummary, renderReportPdf } from "../services/reportService.js";
import { writeAuditLog } from "../services/auditService.js";

export async function listReports(req, res) {
  const reports = await ComplianceReport.find().sort({ createdAt: -1 });
  return res.json(reports);
}

export async function generateReport(req, res) {
  const records = await IngestionRecord.find().sort({ createdAt: -1 }).limit(100);
  const summary = buildSummary(records);
  const findings = records
    .filter((record) => record.complianceStatus === "Violation" || record.riskScore !== "Low")
    .map((record) => ({
      recordId: record.recordId,
      complianceStatus: record.complianceStatus,
      riskScore: record.riskScore,
      owner: record.owner,
      sourceType: record.sourceType
    }));

  const report = await ComplianceReport.create({
    reportName: `compliance-report-${Date.now()}`,
    generatedBy: req.user.email,
    summary,
    metrics: summary,
    findings
  });

  await writeAuditLog({
    action: "report.generate",
    actor: req.user.email,
    details: { reportId: report._id.toString(), findings: findings.length }
  });

  return res.status(201).json(report);
}

export async function exportReportPdf(req, res) {
  const report = await ComplianceReport.findById(req.params.id);
  if (!report) {
    return res.status(404).json({ message: "Report not found" });
  }

  return renderReportPdf(report, res);
}
