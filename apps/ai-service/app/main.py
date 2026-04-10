from __future__ import annotations

from fastapi import FastAPI

from app.models import BatchDetectionRequest, BatchDetectionResponse, DetectionResponse, FeedbackItem, IngestionRecord, RuleDefinition
from app.rules import DEFAULT_RULES
from app.sample_data import SAMPLE_RECORDS
from app.services import DetectionEngine


app = FastAPI(title="IntrusionX AI Service", version="1.0.0")
engine = DetectionEngine()
active_rules: list[RuleDefinition] = list(DEFAULT_RULES)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/sample")
def sample() -> list[dict]:
    return [record.model_dump() for record in SAMPLE_RECORDS]


@app.get("/rules")
def get_rules() -> list[dict]:
    return [rule.model_dump() for rule in active_rules]


@app.post("/rules")
def set_rules(rules: list[RuleDefinition]) -> dict[str, object]:
    active_rules.clear()
    active_rules.extend(rules)
    return {"message": "Rules updated", "count": len(active_rules)}


@app.post("/analyze", response_model=DetectionResponse)
def analyze_record(record: IngestionRecord) -> DetectionResponse:
    return engine.analyze(record, active_rules)


@app.post("/analyze/batch", response_model=BatchDetectionResponse)
def analyze_batch(payload: BatchDetectionRequest) -> BatchDetectionResponse:
    return BatchDetectionResponse(results=[engine.analyze(record, active_rules) for record in payload.records])


@app.post("/feedback")
def submit_feedback(feedback: FeedbackItem) -> dict[str, object]:
    return {
        "message": "Feedback stored",
        "stats": engine.register_feedback(feedback),
    }
