from __future__ import annotations

from app.models import RuleDefinition


DEFAULT_RULES = [
    RuleDefinition(
        ruleId="RULE-SENSITIVE-OWNER",
        name="Sensitive Data Ownership Restriction",
        description="Sensitive data must stay with approved teams only.",
        severity="high",
        enabled=True,
        condition="sensitive_owner_allowlist",
    ),
    RuleDefinition(
        ruleId="RULE-AADHAAR-REGION",
        name="Aadhaar Residency Rule",
        description="Aadhaar-like identifiers are allowed only in India region.",
        severity="high",
        enabled=True,
        condition="aadhaar_india_only",
    ),
    RuleDefinition(
        ruleId="RULE-UNAUTHORIZED-ACCESS",
        name="Unauthorized Access Pattern",
        description="Detect suspicious repeated login failures or privileged access misuse.",
        severity="medium",
        enabled=True,
        condition="unauthorized_access_pattern",
    ),
]
