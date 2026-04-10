import { env } from "../config/env.js";
import { httpJson } from "../utils/httpClient.js";

export async function analyzeRecord(payload) {
  return httpJson(`${env.aiServiceUrl}/analyze`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function analyzeBatch(records) {
  return httpJson(`${env.aiServiceUrl}/analyze/batch`, {
    method: "POST",
    body: JSON.stringify({ records })
  });
}

export async function fetchRulesFromAi() {
  return httpJson(`${env.aiServiceUrl}/rules`);
}

export async function syncRulesToAi(rules) {
  return httpJson(`${env.aiServiceUrl}/rules`, {
    method: "POST",
    body: JSON.stringify(rules)
  });
}

export async function submitFeedbackToAi(payload) {
  return httpJson(`${env.aiServiceUrl}/feedback`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}
