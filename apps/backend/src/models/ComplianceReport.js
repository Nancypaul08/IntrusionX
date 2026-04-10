import mongoose from "mongoose";

const complianceReportSchema = new mongoose.Schema(
  {
    reportName: { type: String, required: true },
    generatedBy: { type: String, required: true },
    summary: { type: mongoose.Schema.Types.Mixed, required: true },
    metrics: { type: mongoose.Schema.Types.Mixed, required: true },
    findings: { type: [mongoose.Schema.Types.Mixed], default: [] }
  },
  { timestamps: true }
);

export const ComplianceReport = mongoose.model("ComplianceReport", complianceReportSchema);
