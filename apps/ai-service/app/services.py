from __future__ import annotations

import base64
import re
from collections import Counter

from app.models import DetectionResponse, FeedbackItem, IngestionRecord, PIIMatch, RuleDefinition, RuleOutcome


PII_PATTERNS: dict[str, str] = {
    "email": r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}",
    "phone": r"\b(?:\+91[- ]?)?[6-9]\d{9}\b",
    "aadhaar": r"\b\d{4}-\d{4}-\d{4}\b",
}

SENSITIVE_ALLOWLIST = {"security", "support", "finance", "legal"}
SUSPICIOUS_TERMS = {
    "failed login",
    "privilege escalation",
    "admin endpoint",
    "unauthorized",
    "token leak",
    "suspicious request",
}


class DetectionEngine:
    def __init__(self) -> None:
        self.feedback_counts: Counter[str] = Counter()

    def analyze(self, record: IngestionRecord, rules: list[RuleDefinition]) -> DetectionResponse:
        normalized_content = self._normalize(record.content)
        pii_matches = self._find_pii(normalized_content)
        classification = "Sensitive" if pii_matches else "Non-Sensitive"
        sensitive_entities = sorted({match.piiType for match in pii_matches})
        unauthorized_access_detected = self._detect_unauthorized_access(normalized_content, record.tags)
        exposure_detected = classification == "Sensitive" and record.owner.lower() not in SENSITIVE_ALLOWLIST
        rule_outcomes = self._evaluate_rules(
            record=record,
            pii_matches=pii_matches,
            unauthorized_access_detected=unauthorized_access_detected,
            rules=rules,
        )
        compliance_status = "Violation" if any(not outcome.passed for outcome in rule_outcomes) else "Compliant"
        risk_score = self._score_risk(pii_matches, unauthorized_access_detected, compliance_status)
        remediation = self._build_remediation(
            content=normalized_content,
            pii_matches=pii_matches,
            unauthorized_access_detected=unauthorized_access_detected,
            compliance_status=compliance_status,
        )

        return DetectionResponse(
            recordId=record.recordId,
            normalizedContent=normalized_content,
            piiMatches=pii_matches,
            sensitiveEntities=sensitive_entities,
            classification=classification,
            unauthorizedAccessDetected=unauthorized_access_detected,
            exposureDetected=exposure_detected,
            complianceStatus=compliance_status,
            ruleOutcomes=rule_outcomes,
            riskScore=risk_score,
            remediation=remediation,
            encryptedContent=self._encrypt_content(normalized_content),
        )

    def register_feedback(self, feedback: FeedbackItem) -> dict[str, int]:
        self.feedback_counts[feedback.label] += 1
        return dict(self.feedback_counts)

    def _normalize(self, content: str) -> str:
        return " ".join(content.split())

    def _find_pii(self, text: str) -> list[PIIMatch]:
        matches: list[PIIMatch] = []
        for pii_type, pattern in PII_PATTERNS.items():
            for match in re.finditer(pattern, text):
                matches.append(
                    PIIMatch(
                        piiType=pii_type,
                        value=match.group(0),
                        start=match.start(),
                        end=match.end(),
                    )
                )
        matches.sort(key=lambda item: item.start)
        return matches

    def _detect_unauthorized_access(self, content: str, tags: list[str]) -> bool:
        lower_content = content.lower()
        lower_tags = {tag.lower() for tag in tags}
        return any(term in lower_content for term in SUSPICIOUS_TERMS) or bool(
            {"login-failure", "unauthorized", "privileged"} & lower_tags
        )

    def _evaluate_rules(
        self,
        record: IngestionRecord,
        pii_matches: list[PIIMatch],
        unauthorized_access_detected: bool,
        rules: list[RuleDefinition],
    ) -> list[RuleOutcome]:
        pii_types = {match.piiType for match in pii_matches}
        outcomes: list[RuleOutcome] = []

        for rule in rules:
            if not rule.enabled:
                continue

            passed = True
            message = "Rule satisfied"

            if rule.condition == "sensitive_owner_allowlist":
                passed = not pii_matches or record.owner.lower() in SENSITIVE_ALLOWLIST
                if not passed:
                    message = "Sensitive data routed to an unauthorized owner"

            elif rule.condition == "aadhaar_india_only":
                passed = "aadhaar" not in pii_types or record.region.upper() == "IN"
                if not passed:
                    message = "Aadhaar data detected outside India region"

            elif rule.condition == "unauthorized_access_pattern":
                passed = not unauthorized_access_detected
                if not passed:
                    message = "Unauthorized or suspicious access pattern detected"

            outcomes.append(
                RuleOutcome(
                    ruleId=rule.ruleId,
                    passed=passed,
                    severity=rule.severity,
                    message=message,
                )
            )
        return outcomes

    def _score_risk(
        self,
        pii_matches: list[PIIMatch],
        unauthorized_access_detected: bool,
        compliance_status: str,
    ) -> str:
        if compliance_status == "Violation" and unauthorized_access_detected:
            return "High"
        if compliance_status == "Violation" or len(pii_matches) >= 2:
            return "High"
        if pii_matches or unauthorized_access_detected:
            return "Medium"
        return "Low"

    def _build_remediation(
        self,
        content: str,
        pii_matches: list[PIIMatch],
        unauthorized_access_detected: bool,
        compliance_status: str,
    ) -> dict:
        masked_content = content
        for match in sorted(pii_matches, key=lambda item: len(item.value), reverse=True):
            masked_content = masked_content.replace(match.value, self._mask_value(match.value))

        return {
            "maskedContent": masked_content,
            "blocked": unauthorized_access_detected or compliance_status == "Violation",
            "encryptionApplied": bool(pii_matches),
            "recommendedAction": "Quarantine and review"
            if compliance_status == "Violation"
            else "Allow with monitoring",
        }

    def _mask_value(self, value: str) -> str:
        digits = [char for char in value if char.isdigit()]
        if len(digits) >= 6 and value.replace("-", "").isdigit() is False and "@" not in value:
            return value[:2] + "****" + value[-2:]
        if "@" in value:
            username, domain = value.split("@", 1)
            return username[:1] + "*" * max(len(username) - 1, 3) + "@" + domain
        return value[:2] + "****" + value[-2:]

    def _encrypt_content(self, text: str) -> str:
        return base64.b64encode(text.encode("utf-8")).decode("utf-8")
