from __future__ import annotations

from datetime import datetime, timezone
from typing import Literal
from uuid import uuid4

from pydantic import BaseModel, Field


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


class IngestionRecord(BaseModel):
    sourceType: Literal["logs", "api", "database"]
    sourceName: str
    owner: str
    region: str = Field(min_length=2, max_length=8)
    actorId: str
    content: str = Field(min_length=3)
    tags: list[str] = Field(default_factory=list)
    metadata: dict[str, str] = Field(default_factory=dict)
    recordId: str = Field(default_factory=lambda: f"REC-{uuid4().hex[:12].upper()}")
    timestamp: str = Field(default_factory=utc_now)


class PIIMatch(BaseModel):
    piiType: str
    value: str
    start: int
    end: int


class RuleOutcome(BaseModel):
    ruleId: str
    passed: bool
    severity: Literal["low", "medium", "high"]
    message: str


class DetectionResponse(BaseModel):
    recordId: str
    normalizedContent: str
    piiMatches: list[PIIMatch]
    sensitiveEntities: list[str]
    classification: Literal["Sensitive", "Non-Sensitive"]
    unauthorizedAccessDetected: bool
    exposureDetected: bool
    complianceStatus: Literal["Compliant", "Violation"]
    ruleOutcomes: list[RuleOutcome]
    riskScore: Literal["Low", "Medium", "High"]
    remediation: dict
    encryptedContent: str
    modelVersion: str = "intrusionx-heuristic-1.0"


class BatchDetectionRequest(BaseModel):
    records: list[IngestionRecord]


class BatchDetectionResponse(BaseModel):
    results: list[DetectionResponse]


class FeedbackItem(BaseModel):
    recordId: str
    analyst: str
    label: Literal["true_positive", "false_positive", "false_negative"]
    notes: str = ""
    timestamp: str = Field(default_factory=utc_now)


class RuleDefinition(BaseModel):
    ruleId: str
    name: str
    description: str
    severity: Literal["low", "medium", "high"]
    enabled: bool = True
    condition: str
