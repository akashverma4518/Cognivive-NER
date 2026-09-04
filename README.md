# Cognivive NER — Smart India Hackathon 2026
> **A Supportive Cognitive Activity, Memory Assistance & Caregiver Monitoring Platform for Elderly Care**  
> *(Strictly Non-Diagnostic Assistive Technology)*

---

## 1. Project Overview

**Cognivive NER** is a full-stack, AI-assisted platform engineered for elderly citizens, their family caregivers, and clinicians. Designed for the Smart India Hackathon 2026, Cognivive empowers seniors through engaging, culturally resonant cognitive activities, audio-guided routine reminders, multilingual voice interaction (English and Hindi), and local-first offline resilience, while equipping caregivers with longitudinal analytics, 5-domain activity profiling, and proactive notifications.

> [!IMPORTANT]
> **NON-DIAGNOSTIC MANDATE**: This system is strictly an assistive and cognitive monitoring platform. It does **not** diagnose Mild Cognitive Impairment (MCI), dementia, or Alzheimer’s, nor does it generate medical risk scores, clinical predictions, or MMSE equivalents. All metrics reflect in-app task activity and personal baseline tracking.

---

## 2. System Architecture

Cognivive NER uses a decoupled microservices architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                 React + Vite Frontend (Port 3000)           │
│  - Elder Portal (High contrast, 60px+ targets, Voice)       │
│  - Caregiver Portal (5-Domain Radar, Trends, Adherence)     │
│  - Offline Database (IndexedDB queue + auto-sync)           │
└──────────────┬───────────────────────────────▲──────────────┘
               │ HTTP REST                     │ Event sync
               ▼                               │
┌──────────────────────────────────────────────┴──────────────┐
│             Node.js + Express Backend API (Port 5000)        │
│  - JWT Authentication & RBAC (Elder, Caregiver, Clinician)  │
│  - Session Ingestion & Idempotent Batch Sync Engine         │
│  - Security Isolation & Caregiver-Patient Relational Auth   │
└──────────────┬───────────────────────────────▲──────────────┘
               │ SQL Pool                      │ Microservice REST
               ▼                               ▼
┌──────────────────────────────┐ ┌────────────────────────────┐
│   PostgreSQL 16 (Port 5432)  │ │ Python FastAPI AI (Port 8000)│
│  - users & profiles          │ │  - Real DDA Engine         │
│  - game_sessions (telemetry) │ │  - 5-Domain EMA Profiler   │
│  - reminders & reminder_logs │ │  - Multilingual Voice      │
│  - player_difficulty_states  │ │  - Baseline Change Detector│
└──────────────────────────────┘ └────────────────────────────┘
```

---

## 3. Tech Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Html.
- **Backend API**: Node.js, Express.js, TypeScript
- **AI Microservice**: Python 3.12, FastAPI,NumPy.
- **Database**: PostgreSQL .
- **Containerization**: Docker & Docker Compose (`docker-compose.yml`).

---

## 4. Repository Structure

```
Cognivive-NER/
├── ai_service/             # Python FastAPI cognitive AI microservice
│   ├── app/
│   │   ├── services/       # DDA engine, EMA profiler, voice parser, change detector
│   │   ├── models/         # Pydantic telemetry & profiling schemas
│   │   └── main.py         # AI service entrypoint
│   └── requirements.txt
├── backend/                # Node.js + Express TypeScript backend
│   ├── migrations/         # 001_initial_schema.sql, 002_seed_data.sql
│   ├── src/
│   │   ├── controllers/    # auth, gameSession, reminder, caregiver, sync, aiProxy
│   │   ├── middleware/     # authMiddleware, roleMiddleware, errorHandler
│   │   └── scripts/        # seedDemo.ts
│   └── package.json
├── frontend/               # React + Vite elderly & caregiver UI
│   ├── src/
│   │   ├── components/     # CognitiveRadarChart, TrendLineChart, GameShell, etc.
│   │   ├── games/          # Memory Blossom, Quick Harvest, Golden Memories
│   │   ├── pages/          # ElderHome, CaregiverHome, ClinicianHome, Login
│   │   └── context/        # AuthContext, SyncContext (IndexedDB sync)
│   └── package.json
├── scripts/                # Automated E2E verification test suites (Phases 1-6)
├── docker-compose.yml      # Orchestrates all 4 services + persistence
├── DEMO_GUIDE.md           # Step-by-step 5-7 minute SIH judge presentation guide
└── README.md
```

---

## 5. Demo Accounts & Credentials

All demo accounts use fictional identities and the standard password: `password123`.

| Role | Email | Password | Primary Purpose |
|---|---|---|---|
| **Elder** | `elder@cognivive.com` | `password123` | Plays cognitive activities, voice commands, marks reminders |
| **Caregiver** | `caregiver@cognivive.com` | `password123` | Inspects 5-domain radar, trends, game metrics, overrides difficulty |
| **Clinician** | `clinician@cognivive.com` | `password123` | Cohort oversight and compliance review |

---

## 6. Quick Start (Local Setup)

### Prerequisites
- Node.js 18+ and npm
- Python 3.10+
- PostgreSQL 16 (running on port 5432)

### Step 1: Database Setup
```bash
psql -U postgres -d postgres -c "CREATE DATABASE cognivive_db;"
psql -U postgres -d cognivive_db -f backend/migrations/001_initial_schema.sql
psql -U postgres -d cognivive_db -f backend/migrations/002_seed_data.sql
```

### Step 2: Seed Demo Data
```bash
cd backend
npm install
npm run seed:demo
```

### Step 3: Launch Services
1. **Python AI Microservice**:
   ```bash
   cd ai_service
   python -m venv venv
   venv\Scripts\activate   # On Windows (or source venv/bin/activate on Linux/Mac)
   pip install -r requirements.txt
   python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
   ```

2. **Node.js Express Backend**:
   ```bash
   cd backend
   npm run build
   node dist/index.js
   ```

3. **React Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

Open browser at `http://localhost:3000`.

---

## 7. Docker Deployment

To launch the complete containerized stack:
```bash
docker compose build
docker compose up -d
```
All four services will start automatically with healthchecks:
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:5000/health`
- AI Service: `http://localhost:8000/health`
- Database: `localhost:5432`

---

## 8. Automated Testing & Verification Matrix

The repository contains 6 automated test suites covering all phases:

| Test Script | Scope | Tests | Status |
|---|---|---|---|
| `scripts/test_phase1_e2e.py` | Microservices health, DB pools, JWT auth, DDA integration | 12 / 12 | **100% PASS** |
| `scripts/test_phase2_frontend.py` | Elder UI, RBAC guards, recommendations, accessibility | 8 / 8 | **100% PASS** |
| `scripts/test_phase3_games_e2e.py` | 3 playable games, telemetry latency, AI DDA calibration | 11 / 11 | **100% PASS** |
| `scripts/test_phase4_reminders_voice_offline.py` | Reminders, voice commands, IndexedDB offline sync | 10 / 10 | **100% PASS** |
| `scripts/test_phase5_caregiver_dashboard.py` | Radar chart, trends, game-wise metrics, non-diagnostic alerts | 12 / 12 | **100% PASS** |
| `scripts/test_phase6_sih_demo_readiness.py` | Complete end-to-end journey, security audit, DDA scenarios | 10 / 10 | **100% PASS** |
| **Total Automated Tests** | — | **63 / 63** | **0 Failures** |

Run the complete verification:
```bash
ai_service/venv/Scripts/python scripts/test_phase6_sih_demo_readiness.py
```

---

## 9. SIH Demonstration Guide

For the exact 5–7 minute walkthrough script and judge talking points, refer to [DEMO_GUIDE.md](file:///c:/Users/Dell/Downloads/Cognivive-NER/DEMO_GUIDE.md).

---

## 10. Non-Diagnostic Disclaimer

Cognivive NER is an assistive digital companion designed to support active cognitive engagement, routine habit reinforcement, and caregiver awareness. **Cognivive NER does not provide medical advice, diagnosis, treatment, or clinical prognosis.** Any alerts generated indicate in-app task performance variance relative to an individual's personal baseline and are meant solely to prompt supportive check-ins by family or caregivers.
