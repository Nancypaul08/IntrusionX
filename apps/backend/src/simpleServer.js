import crypto from "crypto";
import fs from "fs";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import jwt from "jsonwebtoken";
import morgan from "morgan";
import PDFDocument from "pdfkit";
import { Server } from "socket.io";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

const env = {
  port: Number(process.env.PORT || 5055),
  clientOrigin: process.env.CLIENT_ORIGIN || "http://127.0.0.1:5173",
  aiServiceUrl: process.env.AI_SERVICE_URL || "http://127.0.0.1:8000",
  jwtSecret: process.env.JWT_SECRET || "change-me"
};

const store = {
  users: [],
  rules: [],
  records: [],
  alerts: [],
  reports: [],
  auditLogs: []
};

let io = null;

function immutableHash(payload) {
  return crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

function objectId(prefix) {
  return `${prefix}_${crypto.randomBytes(6).toString("hex")}`;
}

function signToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    env.jwtSecret,
    { expiresIn: "12h" }
  );
}

function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    req.user = jwt.verify(token, env.jwtSecret);
    return next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }
    return next();
  };
}

function writeAuditLog({ recordId = null, action, actor, details }) {
  const log = {
    _id: objectId("audit"),
    recordId,
    action,
    actor,
    details,
    immutableHash: immutableHash({ recordId, action, actor, details, at: new Date().toISOString() }),
    createdAt: new Date().toISOString()
  };
  store.auditLogs.unshift(log);
  return log;
}

function pushAlert({ title, message, severity, recordRef = null }) {
  const alert = {
    _id: objectId("alert"),
    title,
    message,
    severity,
    status: "open",
    recordRef,
    createdAt: new Date().toISOString()
  };
  store.alerts.unshift(alert);
  if (io) {
    io.emit("alert:new", alert);
  }
  return alert;
}

async function analyzeRecord(record) {
  const response = await fetch(`${env.aiServiceUrl}/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(record)
  });

  if (!response.ok) {
    throw new Error(`AI service error: ${response.status}`);
  }

  return response.json();
}

async function analyzeBatch(records) {
  const response = await fetch(`${env.aiServiceUrl}/analyze/batch`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ records })
  });

  if (!response.ok) {
    throw new Error(`AI batch error: ${response.status}`);
  }

  return response.json();
}

async function submitFeedback(feedback) {
  const response = await fetch(`${env.aiServiceUrl}/feedback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(feedback)
  });

  if (!response.ok) {
    throw new Error(`AI feedback error: ${response.status}`);
  }

  return response.json();
}

async function syncRulesToAi() {
  await fetch(`${env.aiServiceUrl}/rules`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(store.rules)
  });
}

function buildSummary(records) {
  return records.reduce(
    (summary, record) => {
      summary.totalRecords += 1;
      if (record.complianceStatus === "Compliant") summary.compliant += 1;
      if (record.complianceStatus === "Violation") summary.violations += 1;
      if (record.riskScore === "Low") summary.lowRisk += 1;
      if (record.riskScore === "Medium") summary.mediumRisk += 1;
      if (record.riskScore === "High") summary.highRisk += 1;
      return summary;
    },
    {
      totalRecords: 0,
      compliant: 0,
      violations: 0,
      lowRisk: 0,
      mediumRisk: 0,
      highRisk: 0
    }
  );
}

function normalizeStoredRecord(input, analysis) {
  return {
    _id: objectId("rec"),
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
    remediation: analysis.remediation,
    createdAt: new Date().toISOString()
  };
}

async function seedInitialData() {
  if (!store.users.length) {
    store.users.push({
      id: objectId("user"),
      name: "IntrusionX Admin",
      email: "admin@intrusionx.io",
      role: "admin",
      passwordHash: await bcrypt.hash("Admin@123", 10)
    });
  }

  if (!store.rules.length) {
    const rulesPath = path.resolve(__dirname, "../../../data/seed/sample-rules.json");
    store.rules = JSON.parse(fs.readFileSync(rulesPath, "utf-8"));
  }

  await syncRulesToAi();

  if (!store.records.length) {
    const recordsPath = path.resolve(__dirname, "../../../data/seed/sample-records.json");
    const records = JSON.parse(fs.readFileSync(recordsPath, "utf-8"));
    const batch = await analyzeBatch(records);
    store.records = records.map((record, index) => normalizeStoredRecord(record, batch.results[index]));

    for (const record of store.records) {
      if (record.complianceStatus === "Violation" || record.riskScore !== "Low") {
        pushAlert({
          title: record.complianceStatus === "Violation" ? "Compliance violation detected" : "Elevated risk detected",
          message: `${record.recordId} flagged as ${record.riskScore} risk`,
          severity: record.riskScore.toLowerCase(),
          recordRef: record._id
        });
      }
      writeAuditLog({
        recordId: record.recordId,
        action: "seed.ingestion",
        actor: "system",
        details: { complianceStatus: record.complianceStatus, riskScore: record.riskScore }
      });
    }
  }
}

function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json({ limit: "1mb" }));
  app.use(morgan("dev"));

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    const user = store.users.find((item) => item.email === email);
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    writeAuditLog({ action: "auth.login", actor: user.email, details: { role: user.role } });
    return res.json({
      token: signToken(user),
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  });

  app.get("/api/dashboard/summary", requireAuth, (req, res) => {
    const metrics = {
      totalRecords: store.records.length,
      compliantRecords: store.records.filter((item) => item.complianceStatus === "Compliant").length,
      violationRecords: store.records.filter((item) => item.complianceStatus === "Violation").length,
      highRiskRecords: store.records.filter((item) => item.riskScore === "High").length,
      mediumRiskRecords: store.records.filter((item) => item.riskScore === "Medium").length
    };

    res.json({
      metrics,
      recentRecords: [...store.records].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8),
      alerts: store.alerts.slice(0, 20)
    });
  });

  app.get("/api/dashboard/risks", requireAuth, (req, res) => {
    res.json({
      Low: store.records.filter((item) => item.riskScore === "Low").length,
      Medium: store.records.filter((item) => item.riskScore === "Medium").length,
      High: store.records.filter((item) => item.riskScore === "High").length
    });
  });

  app.get("/api/logs", requireAuth, (req, res) => {
    res.json({
      records: [...store.records].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 50),
      auditLogs: store.auditLogs.slice(0, 100)
    });
  });

  app.post("/api/ingestion", requireAuth, async (req, res, next) => {
    try {
      const analysis = await analyzeRecord(req.body);
      const stored = normalizeStoredRecord(req.body, analysis);
      store.records.unshift(stored);

      if (stored.complianceStatus === "Violation" || stored.riskScore !== "Low") {
        pushAlert({
          title: stored.complianceStatus === "Violation" ? "Compliance violation detected" : "Elevated risk detected",
          message: `${stored.recordId} triggered ${stored.complianceStatus}`,
          severity: stored.riskScore.toLowerCase(),
          recordRef: stored._id
        });
      }

      writeAuditLog({
        recordId: stored.recordId,
        action: "ingestion.single",
        actor: req.user.email,
        details: { complianceStatus: stored.complianceStatus, riskScore: stored.riskScore }
      });

      if (io) {
        io.emit("dashboard:update", { recordId: stored.recordId });
      }

      res.status(201).json(stored);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/ingestion/batch", requireAuth, async (req, res, next) => {
    try {
      const records = req.body.records || [];
      const analysis = await analyzeBatch(records);
      const savedRecords = records.map((record, index) => normalizeStoredRecord(record, analysis.results[index]));
      store.records.unshift(...savedRecords.reverse());

      for (const stored of savedRecords) {
        if (stored.complianceStatus === "Violation" || stored.riskScore !== "Low") {
          pushAlert({
            title: stored.complianceStatus === "Violation" ? "Compliance violation detected" : "Elevated risk detected",
            message: `${stored.recordId} flagged as ${stored.riskScore} risk`,
            severity: stored.riskScore.toLowerCase(),
            recordRef: stored._id
          });
        }
        writeAuditLog({
          recordId: stored.recordId,
          action: "ingestion.batch",
          actor: req.user.email,
          details: { complianceStatus: stored.complianceStatus, riskScore: stored.riskScore }
        });
      }

      if (io) {
        io.emit("dashboard:update", { batchCount: savedRecords.length });
      }

      res.status(201).json(savedRecords);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/alerts", requireAuth, (req, res) => {
    res.json(store.alerts.slice(0, 50));
  });

  app.patch("/api/alerts/:id/acknowledge", requireAuth, (req, res) => {
    const alert = store.alerts.find((item) => item._id === req.params.id);
    if (!alert) {
      return res.status(404).json({ message: "Alert not found" });
    }
    alert.status = "acknowledged";
    res.json(alert);
  });

  app.get("/api/reports", requireAuth, (req, res) => {
    res.json(store.reports);
  });

  app.post("/api/reports", requireAuth, (req, res) => {
    const summary = buildSummary(store.records);
    const report = {
      _id: objectId("report"),
      reportName: `compliance-report-${Date.now()}`,
      generatedBy: req.user.email,
      summary,
      metrics: summary,
      findings: store.records
        .filter((item) => item.complianceStatus === "Violation" || item.riskScore !== "Low")
        .map((item) => ({
          recordId: item.recordId,
          complianceStatus: item.complianceStatus,
          riskScore: item.riskScore,
          owner: item.owner,
          sourceType: item.sourceType
        })),
      createdAt: new Date().toISOString()
    };

    store.reports.unshift(report);
    writeAuditLog({
      action: "report.generate",
      actor: req.user.email,
      details: { reportId: report._id, findings: report.findings.length }
    });
    res.status(201).json(report);
  });

  app.get("/api/reports/:id/pdf", requireAuth, (req, res) => {
    const report = store.reports.find((item) => item._id === req.params.id);
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    const doc = new PDFDocument({ margin: 40 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=${report.reportName}.pdf`);
    doc.pipe(res);
    doc.fontSize(22).text("IntrusionX Compliance Report", { underline: true });
    doc.moveDown();
    doc.fontSize(12).text(`Generated By: ${report.generatedBy}`);
    doc.text(`Generated At: ${new Date(report.createdAt).toLocaleString()}`);
    doc.moveDown();
    doc.fontSize(16).text("Summary");
    Object.entries(report.summary).forEach(([key, value]) => doc.fontSize(12).text(`${key}: ${value}`));
    doc.moveDown();
    doc.fontSize(16).text("Findings");
    report.findings.forEach((finding, index) => {
      doc.fontSize(12).text(`${index + 1}. ${finding.recordId} | ${finding.complianceStatus} | ${finding.riskScore}`);
    });
    doc.end();
  });

  app.post("/api/feedback", requireAuth, async (req, res, next) => {
    try {
      const response = await submitFeedback(req.body);
      writeAuditLog({
        recordId: req.body.recordId,
        action: "feedback.submit",
        actor: req.user.email,
        details: { label: req.body.label }
      });
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/admin/rules", requireAuth, requireRole("admin"), (req, res) => {
    res.json(store.rules);
  });

  app.put("/api/admin/rules/:ruleId", requireAuth, requireRole("admin"), async (req, res, next) => {
    try {
      const rule = store.rules.find((item) => item.ruleId === req.params.ruleId);
      if (!rule) {
        return res.status(404).json({ message: "Rule not found" });
      }

      Object.assign(rule, req.body);
      await syncRulesToAi();
      writeAuditLog({
        action: "rule.update",
        actor: req.user.email,
        details: { ruleId: rule.ruleId, enabled: rule.enabled, severity: rule.severity }
      });
      res.json(rule);
    } catch (error) {
      next(error);
    }
  });

  app.use((error, req, res, next) => {
    console.error(error);
    res.status(500).json({ message: error.message || "Internal server error" });
  });

  return app;
}

async function bootstrap() {
  await seedInitialData();

  const app = createApp();
  const server = http.createServer(app);
  io = new Server(server, {
    cors: { origin: true, credentials: true }
  });

  io.on("connection", (socket) => {
    socket.emit("system:ready", { message: "Realtime channel connected" });
  });

  server.listen(env.port, "127.0.0.1", () => {
    console.log(`IntrusionX backend running on http://127.0.0.1:${env.port}`);
  });
}

bootstrap().catch((error) => {
  console.error("Failed to start simple backend", error);
  process.exit(1);
});
