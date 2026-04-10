import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { User } from "../models/User.js";
import { Rule } from "../models/Rule.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function seedDefaultAdmin() {
  const existing = await User.findOne({ email: "admin@intrusionx.io" });
  if (existing) return;

  const passwordHash = await bcrypt.hash("Admin@123", 10);
  await User.create({
    name: "IntrusionX Admin",
    email: "admin@intrusionx.io",
    passwordHash,
    role: "admin"
  });
}

export async function seedRules() {
  const count = await Rule.countDocuments();
  if (count > 0) return;

  const rulesPath = path.resolve(__dirname, "../../../../data/seed/sample-rules.json");
  const rules = JSON.parse(fs.readFileSync(rulesPath, "utf-8"));
  await Rule.insertMany(rules);
}
