# Athle-Tech One-Page Architecture Blueprint

## 1. System Guardrails & Control Strategy
* **Development Environment:** Google Antigravity (Agentic IDE / Review Mode enabled)
* **Execution Constraint:** 30–45 minute sessions (Mon / Wed / Fri, 05:15–06:00 AM)
* **Learning & Safety Rule:** No auto-commit. All AI changes must generate a diff artifact for explicit human approval.

---

## 2. Database Schema (PostgreSQL)

### `athletes_athlete`
* `athlete_id` (UUID, Primary Key)
* `full_name` (VARCHAR)
* `age_category` (VARCHAR: 'U16', 'U18', 'U20', 'SENIOR')
* `primary_discipline` (VARCHAR: 'TRACK_FIELD', 'CROSS_COUNTRY', 'ROAD')
* `created_at` (TIMESTAMP)

### `athletes_attendancelog`
* `id` (BIGINT, Primary Key)
* `athlete_id` (FK -> `athletes_athlete.athlete_id`)
* `date` (DATE)
* `session_type` (VARCHAR: 'TRACK', 'TEMPO', 'GYM', 'LONG_RUN')
* `rpe` (INTEGER: 1 to 10 rating of perceived exertion)
* `status` (VARCHAR: 'PRESENT', 'ABSENT', 'INJURED')

### `athletes_raceresult`
* `id` (BIGINT, Primary Key)
* `athlete_id` (FK -> `athletes_athlete.athlete_id`)
* `date` (DATE)
* `event_name` (VARCHAR: e.g., '100m', '1500m', '10K Road')
* `recorded_time_seconds` (DECIMAL: exact time in seconds)
* `national_standard_seconds` (DECIMAL: target ASA benchmark time)

---

## 3. Backend Core (Django REST Framework)

### Core Modules
* **`athletes/models.py`**: Clean, unpolluted Django ORM models mapping directly to the PostgreSQL schema.
* **`athletes/services.py`**:
  * `calculate_acwr(athlete_id)`: Computes Acute (7-day RPE sum) vs. Chronic (28-day weekly average RPE) load ratios to flag injury risk.
  * `get_performance_summary(athlete_id)`: Calculates target delta (`recorded_time - national_standard`) and percentage gaps.
* **`athletes/serializers.py`**: Exposes JSON representation for API consumption without raw DB leaks.
* **`athletes/views.py`**: DRF `ModelViewSet` routing endpoints (`/api/athletes/`, `/api/athletes/{id}/workload/`).

---

## 4. Frontend Application (Vue.js + TypeScript)

### Screen 1: Athlete Roster (`/athletes`)
* Displays athlete cards filtered by discipline (Track, XC, Road).
* Quick action button: "Log Today's Workload".

### Screen 2: Attendance & Load Logger (`/attendance`)
* Fast grid UI for coaches to input RPE (1-10) and attendance status per athlete in under 60 seconds post-session.
* Displays instant visual alert badge if ACWR exceeds 1.5 (High Injury Risk).

### Screen 3: Performance & Delta Tracker (`/performance`)
* Input race event times.
* Displays time delta against national standards with visual progress bars toward qualifying targets.

---

## 5. 45-Minute Micro-Task Schedule

| Day | Focus | 45-Min Action Target |
| :--- | :--- | :--- |
| **Mon** | **Spec & Blueprint** | Review paper sketch; prompt Antigravity to generate single-component diff. |
| **Wed** | **Code & Review** | Review diff artifact line-by-line; run migration or test component. |
| **Fri** | **Verify & Commit** | Run local server; verify functionality manually; commit to Git. |