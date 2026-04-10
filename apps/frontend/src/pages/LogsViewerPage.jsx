import { useEffect, useState } from "react";
import { Panel } from "../components/Panel";
import { StatusPill } from "../components/StatusPill";
import api from "../services/api";

export function LogsViewerPage() {
  const [payload, setPayload] = useState({ records: [], auditLogs: [] });

  useEffect(() => {
    api.get("/logs").then((response) => setPayload(response.data));
  }, []);

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Panel title="Processed Logs" subtitle="Normalized records with AI outcomes">
        <div className="space-y-3">
          {payload.records.map((record) => (
            <div key={record._id} className="rounded-2xl border border-cyber-line bg-slate-950/40 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-white">{record.recordId}</p>
                <div className="flex gap-2">
                  <StatusPill value={record.riskScore} />
                  <StatusPill value={record.complianceStatus} />
                </div>
              </div>
              <p className="mt-2 text-sm text-slate-300">{record.normalizedContent}</p>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Immutable Audit Trail" subtitle="Security actions, report generation, and feedback events">
        <div className="space-y-3">
          {payload.auditLogs.map((log) => (
            <div key={log._id} className="rounded-2xl border border-cyber-line bg-slate-950/40 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-cyber-neon">{log.action}</p>
                <p className="text-xs text-slate-500">{new Date(log.createdAt).toLocaleString()}</p>
              </div>
              <p className="mt-2 break-all text-xs text-slate-500">{log.immutableHash}</p>
              <pre className="mt-3 whitespace-pre-wrap text-xs text-slate-400">
                {JSON.stringify(log.details, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
