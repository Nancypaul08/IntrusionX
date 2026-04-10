import { useEffect, useState } from "react";
import api from "../services/api";
import { MetricCard } from "../components/MetricCard";
import { Panel } from "../components/Panel";
import { StatusPill } from "../components/StatusPill";
import { useRealtimeFeed } from "../hooks/useRealtimeFeed";

export function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const realtimeEvents = useRealtimeFeed();

  useEffect(() => {
    async function load() {
      const response = await api.get("/dashboard/summary");
      setSummary(response.data);
      setLoading(false);
    }

    load();
  }, []);

  if (loading) {
    return <div className="text-slate-400">Loading dashboard...</div>;
  }

  const { metrics, recentRecords, alerts } = summary;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard title="Total Records" value={metrics.totalRecords} accent="blue" />
        <MetricCard title="Compliant" value={metrics.compliantRecords} accent="neon" />
        <MetricCard title="Violations" value={metrics.violationRecords} accent="red" />
        <MetricCard title="High Risk" value={metrics.highRiskRecords} accent="red" />
        <MetricCard title="Medium Risk" value={metrics.mediumRiskRecords} accent="amber" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.45fr_1fr]">
        <Panel title="Real-Time Data Monitoring" subtitle="Latest ingested events and privacy classification state">
          <div className="space-y-3">
            {recentRecords.map((record) => (
              <div key={record._id} className="rounded-2xl border border-cyber-line bg-slate-950/30 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-white">{record.recordId}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {record.sourceType} · {record.owner} · {record.region}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <StatusPill value={record.riskScore} />
                    <StatusPill value={record.complianceStatus} />
                  </div>
                </div>
                <p className="mt-3 text-sm text-slate-300">{record.normalizedContent}</p>
              </div>
            ))}
          </div>
        </Panel>

        <div className="space-y-6">
          <Panel title="Alerts & Notifications" subtitle="Streaming risk events from the backend">
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div key={alert._id} className="rounded-2xl border border-cyber-line bg-slate-950/30 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-white">{alert.title}</p>
                    <StatusPill value={alert.status} />
                  </div>
                  <p className="mt-2 text-sm text-slate-300">{alert.message}</p>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Realtime Bus" subtitle="Socket events for live monitoring">
            <div className="max-h-72 space-y-3 overflow-auto">
              {realtimeEvents.map((event) => (
                <div key={event.id} className="rounded-2xl border border-cyber-line bg-slate-950/40 p-3 text-sm">
                  <p className="text-cyber-blue">{event.type}</p>
                  <pre className="mt-2 whitespace-pre-wrap text-xs text-slate-400">
                    {JSON.stringify(event.payload, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
