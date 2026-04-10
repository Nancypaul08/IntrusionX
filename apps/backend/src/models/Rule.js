import mongoose from "mongoose";

const ruleSchema = new mongoose.Schema(
  {
    ruleId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    severity: { type: String, enum: ["low", "medium", "high"], required: true },
    enabled: { type: Boolean, default: true },
    condition: { type: String, required: true }
  },
  { timestamps: true }
);

export const Rule = mongoose.model("Rule", ruleSchema);
