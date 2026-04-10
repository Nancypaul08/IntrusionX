# IntrusionX

IntrusionX is a full-stack AI-powered Data Privacy Compliance Checker with:

- React + Tailwind frontend
- Node.js + Express backend
- MongoDB persistence
- Python FastAPI AI service for PII detection and rule evaluation
- Real-time alerts over Socket.IO
- PDF report export, immutable audit logs, feedback loop, and admin rule controls

## Folder Structure

```text
apps/
  ai-service/
    app/
      main.py
      models.py
      rules.py
      sample_data.py
      services.py
    requirements.txt
  backend/
    src/
      config/
      controllers/
      middleware/
      models/
      routes/
      services/
      utils/
      server.js
    package.json
  frontend/
    src/
      components/
      contexts/
      hooks/
      layouts/
      pages/
      services/
      App.jsx
      main.jsx
    package.json
    tailwind.config.js
data/
  seed/
```

## Setup

### 1. Clone And Prepare Environment

```bash
cp .env.example .env
```

Update `.env` with your MongoDB connection string and JWT secret.

### 2. Start MongoDB

Use a local MongoDB instance or MongoDB Atlas.

Example local connection:

```bash
mongodb://127.0.0.1:27017/intrusionx
```

### 3. Run The AI Service

```bash
cd apps/ai-service
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 4. Run The Backend

```bash
cd apps/backend
npm install
npm run dev
```

### 5. Run The Frontend

```bash
cd apps/frontend
npm install
npm run dev
```

### Root Workspace Commands

From the repository root you can now use:

```bash
npm start
```

This starts both the backend and frontend development servers together.

You can also run them individually from the root:

```bash
npm run dev:backend
npm run dev:frontend
```

### 6. Demo Login

The backend seeds a default admin user on startup if it does not exist:

- email: `admin@intrusionx.io`
- password: `Admin@123`

## Main Features

- Data ingestion from API, logs, and database-style batch input
- Regex + heuristic NLP PII detection
- Sensitive/non-sensitive classification
- GDPR-like compliance rule engine
- Unauthorized access and data exposure detection
- Auto-remediation with masking, request blocking, and encryption
- Real-time alerts and dashboard updates
- Immutable audit log trail
- Admin rule management and analyst feedback loop
- Compliance report export to PDF

## API Overview

- `POST /api/auth/login`
- `GET /api/dashboard/summary`
- `GET /api/logs`
- `POST /api/ingestion`
- `POST /api/ingestion/batch`
- `GET /api/reports`
- `GET /api/reports/:id/pdf`
- `GET /api/alerts`
- `POST /api/feedback`
- `GET /api/admin/rules`
- `PUT /api/admin/rules/:ruleId`

## Sample Data

Sample payloads are stored under `data/seed/`.
