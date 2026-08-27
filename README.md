# Athle-Tech 🏃‍♂️⚡

[![Django REST Framework](https://img.shields.io/badge/Django%20REST-3.15+-092e20?style=flat-square&logo=django)](https://www.django-rest-framework.org/)
[![Vue 3](https://img.shields.io/badge/Vue-3.4+-41B883?style=flat-square&logo=vuedotjs)](https://vuejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-4169E1?style=flat-square&logo=postgresql)](https://www.postgresql.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.1+-646CFF?style=flat-square&logo=vite)](https://vitejs.dev/)

**Athle-Tech** is an athlete management, workload monitoring, and performance benchmarking platform engineered for track and field coaches, endurance directors, and sports scientists. It pairs daily administrative roster workflows with sports science telemetry—specifically Tim Gabbett's **Acute:Chronic Workload Ratio (ACWR)** model and **Athletics South Africa (ASA)** qualifying benchmark delta analysis.

---

## 🏗️ Architecture & Stack Overview

┌────────────────────────────────────────────────────────────────────────┐
│                       Vue 3 + TypeScript Client                        │
│                   (Vite · Modular Domain Structure)                   │
│                                                                        │
│  src/analytics/       src/components/athletes/     src/performance/    │
│  WorkloadDashboard    AthleteRoster · Card         PerformanceTracker  │
└───────────────────────────────────┬────────────────────────────────────┘
│ HTTP / REST (JSON)
▼
┌────────────────────────────────────────────────────────────────────────┐
│                     Django REST Framework (DRF)                        │
│                                                                        │
│  /api/athletes/      /api/attendance/      /api/analytics/workload/    │
│  ViewSets · Serializers · Timedelta Rolling Windows · ACWR Aggregation │
└───────────────────────────────────┬────────────────────────────────────┘
│
▼
┌────────────────────────────────────────────────────────────────────────┐
│                          PostgreSQL Database                           │
│  • Athletes (6 disciplines)  • Daily sRPE Logs  • Race Performances    │
└────────────────────────────────────────────────────────────────────────┘


* **Frontend:** Vue 3 (Composition API / `<script setup>`), TypeScript, Vue Router 4, Vite, Custom CSS Dark Theme.
* **Backend:** Python 3.13, Django 6.1, Django REST Framework 3.18, `psycopg2-binary`, `django-cors-headers`.
* **Database:** PostgreSQL with UUID primary keys and composite constraints (`unique_together: (athlete, date)`).

---

## ⚡ Key Capabilities

* **Roster Management:** Full lifecycle tracking across 6 disciplines (*Sprints, Middle Distance, Long Distance, Hurdles, Jumps, Throws*) with discipline-specific filtering and real-time headcounts.
* **Session Workload Telemetry (sRPE):** Rapid logging of Session Rating of Perceived Exertion (sRPE 1–10) and duration to calculate daily Arbitrary Units ($AU = \text{duration} \times \text{RPE}$).
* **Gabbett ACWR Engine:** Backend continuous 28-day window aggregation calculating 7-day Acute Load (Fatigue), 28-day Chronic Load (Fitness), and ACWR with dynamic Gabbett risk zones (*Sweet Spot, Under-trained, Elevated Risk, High Danger*).
* **Multi-Event Performance & ASA Deltas:** PB tracking and national qualification gap analysis (`recorded_mark - asa_target`) formatted in time (`mm:ss.ms`) and distance (`meters`).

---

## 🚀 Quick Start

### Prerequisites
* Python 3.10+
* Node.js 18+ & npm
* PostgreSQL instance

### 1. Backend Setup
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env

# Run migrations and seed data
python manage.py migrate
python manage.py seed_data

# Start DRF server (Port 8000)
python manage.py runserver 8000

### 2. Frontend Setup
Bash
cd frontend
npm install

# Start Vite dev server (Port 3000)
npm run dev
Visit http://localhost:3000 in your browser.

🧪 Testing Suite
Execute the automated backend test suite covering Athlete CRUD, sRPE calculation math, unique daily log constraints, and ASA benchmark delta evaluations:

Bash
cd backend
python manage.py test core
📄 License
Private & Proprietary — Developed for Athletics Development & Performance Tracking.