import mongoose from "mongoose";

const piiMatchSchema = new mongoose.Schema(
  {
    piiType: String,
    value: String,
    start: Number,
    end: Number
  },
  { _id: false }
);

const ruleOutcomeSchema = new mongoose.Schema(
  {
    ruleId: String,
    passed: Boolean,
    severity: String,
    message: String
  },
  { _id: false }
);

const ingestionRecordSchema = new mongoose.Schema(
  {
    recordId: { type: String, required: true, unique: true },
    sourceType: { type: String, required: true },
    sourceName: { type: String, required: true },
    owner: { type: String, required: true },
    region: { type: String, required: true },
    actorId: { type: String, required: true },
    content: { type: String, required: true },
    normalizedContent: { type: String, required: true },
    encryptedContent: { type: String, required: true },
    tags: { type: [String], default: [] },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    piiMatches: { type: [piiMatchSchema], default: [] },
    sensitiveEntities: { type: [String], default: [] },
    classification: { type: String, enum: ["Sensitive", "Non-Sensitive"], required: true },
    unauthorizedAccessDetected: { type: Boolean, default: false },
    exposureDetected: { type: Boolean, default: false },
    complianceStatus: { type: String, enum: ["Compliant", "Violation"], required: true },
    ruleOutcomes: { type: [ruleOutcomeSchema], default: [] },
    riskScore: { type: String, enum: ["Low", "Medium", "High"], required: true },
    remediation: { type: mongoose.Schema.Types.Mixed, required: true }
  },
  { timestamps: true }
);

export const IngestionRecord = mongoose.model("IngestionRecord", ingestionRecordSchema);
