import mongoose from "mongoose";

const alertSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    message: { type: String, required: true },
    severity: { type: String, enum: ["low", "medium", "high"], required: true },
    status: { type: String, enum: ["open", "acknowledged", "resolved"], default: "open" },
    recordRef: { type: mongoose.Schema.Types.ObjectId, ref: "IngestionRecord", default: null }
  },
  { timestamps: true }
);

export const Alert = mongoose.model("Alert", alertSchema);
