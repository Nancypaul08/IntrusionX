import { useEffect, useState } from "react";
import { Panel } from "../components/Panel";
import api from "../services/api";

export function AdminPage() {
  const [rules, setRules] = useState([]);
  const [feedback, setFeedback] = useState({
    recordId: "",
    analyst: "admin@intrusionx.io",
    label: "true_positive",
    notes: ""
  });

  async function loadRules() {
    const response = await api.get("/admin/rules");
    setRules(response.data);
  }

  useEffect(() => {
    loadRules();
  }, []);

  async function toggleRule(rule) {
    await api.put(`/admin/rules/${rule.ruleId}`, {
      enabled: !rule.enabled
    });
    await loadRules();
  }

  async function submitFeedback(event) {
    event.preventDefault();
    await api.post("/feedback", feedback);
    setFeedback((current) => ({ ...current, recordId: "", notes: "" }));
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.25fr_0.9fr]">
      <Panel title="Rule Management" subtitle="Enable, disable, and tune live policy logic">
        <div className="space-y-4">
          {rules.map((rule) => (
            <div key={rule._id} className="rounded-3xl border border-cyber-line bg-slate-950/35 p-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h4 className="text-white">{rule.name}</h4>
                  <p className="mt-1 text-sm text-slate-400">{rule.description}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full border px-3 py-1 text-xs ${
                      rule.enabled
                        ? "border-cyber-neon/40 bg-cyber-neon/10 text-cyber-neon"
                        : "border-cyber-red/40 bg-cyber-red/10 text-cyber-red"
                    }`}
                  >
                    {rule.enabled ? "Enabled" : "Disabled"}
                  </span>
                  <button
                    onClick={() => toggleRule(rule)}
                    className="rounded-2xl border border-cyber-blue/50 px-4 py-2 text-sm text-cyber-blue"
                  >
                    {rule.enabled ? "Disable" : "Enable"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Feedback Loop" subtitle="Send analyst feedback to improve detections">
        <form className="space-y-4" onSubmit={submitFeedback}>
          <input
            value={feedback.recordId}
            onChange={(event) => setFeedback((current) => ({ ...current, recordId: event.target.value }))}
            placeholder="Record ID"
            className="w-full rounded-2xl border border-cyber-line bg-slate-950/60 px-4 py-3"
          />
          <select
            value={feedback.label}
            onChange={(event) => setFeedback((current) => ({ ...current, label: event.target.value }))}
            className="w-full rounded-2xl border border-cyber-line bg-slate-950/60 px-4 py-3"
          >
            <option value="true_positive">True Positive</option>
            <option value="false_positive">False Positive</option>
            <option value="false_negative">False Negative</option>
          </select>
          <textarea
            rows="5"
            value={feedback.notes}
            onChange={(event) => setFeedback((current) => ({ ...current, notes: event.target.value }))}
            placeholder="Analyst notes"
            className="w-full rounded-2xl border border-cyber-line bg-slate-950/60 px-4 py-3"
          />
          <button className="w-full rounded-2xl bg-cyber-neon px-4 py-3 font-semibold text-slate-950">
            Submit Feedback
          </button>
        </form>
      </Panel>
    </div>
  );
}
