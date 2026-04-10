import { Alert } from "../models/Alert.js";

export async function getAlerts(req, res) {
  const alerts = await Alert.find().sort({ createdAt: -1 }).limit(50);
  return res.json(alerts);
}

export async function acknowledgeAlert(req, res) {
  const alert = await Alert.findByIdAndUpdate(
    req.params.id,
    { status: "acknowledged" },
    { new: true }
  );

  if (!alert) {
    return res.status(404).json({ message: "Alert not found" });
  }

  return res.json(alert);
}
