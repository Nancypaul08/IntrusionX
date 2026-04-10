import { IngestionRecord } from "../models/IngestionRecord.js";
import { getRecentAlerts } from "../services/alertService.js";

export async function getSummary(req, res) {
  const totalRecords = await IngestionRecord.countDocuments();
  const compliantRecords = await IngestionRecord.countDocuments({ complianceStatus: "Compliant" });
  const violationRecords = await IngestionRecord.countDocuments({ complianceStatus: "Violation" });
  const highRiskRecords = await IngestionRecord.countDocuments({ riskScore: "High" });
  const mediumRiskRecords = await IngestionRecord.countDocuments({ riskScore: "Medium" });
  const recentRecords = await IngestionRecord.find().sort({ createdAt: -1 }).limit(8);
  const alerts = await getRecentAlerts();

  return res.json({
    metrics: {
      totalRecords,
      compliantRecords,
      violationRecords,
      highRiskRecords,
      mediumRiskRecords
    },
    recentRecords,
    alerts
  });
}

export async function getRiskScores(req, res) {
  const low = await IngestionRecord.countDocuments({ riskScore: "Low" });
  const medium = await IngestionRecord.countDocuments({ riskScore: "Medium" });
  const high = await IngestionRecord.countDocuments({ riskScore: "High" });

  return res.json({
    Low: low,
    Medium: medium,
    High: high
  });
}
