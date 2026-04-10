from app.models import IngestionRecord


SAMPLE_RECORDS = [
    IngestionRecord(
        sourceType="api",
        sourceName="crm-api",
        owner="marketing",
        region="IN",
        actorId="svc-campaign-01",
        content="Customer Rahul email rahul@example.com aadhaar 1234-5678-9012 requested premium plan details.",
        tags=["campaign", "customer"],
    ),
    IngestionRecord(
        sourceType="logs",
        sourceName="auth-gateway",
        owner="security",
        region="EU",
        actorId="analyst-42",
        content="Privilege escalation attempt with repeated failed login detected for admin endpoint.",
        tags=["auth", "login-failure", "admin"],
    ),
]
