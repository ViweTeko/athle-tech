### 2. Root `blueprint.md` (`/blueprint.md`)

```markdown
# Athle-Tech Technical Blueprint & Domain Specifications

## 1. Architectural Guardrails
* **Pattern:** Domain-Driven, Feature-Based Modular Architecture.
* **Backend:** REST API over Django ORM with decoupled viewsets and analytical aggregation endpoints.
* **Frontend:** Feature-grouped components, composables, and type definitions with zero technical debt or orphan dependencies.
* **Data Integrity:** UUID primary keys, strict foreign key constraints, `MinValueValidator`/`MaxValueValidator` ranges, and unique daily attendance indexes.

---

## 2. Relational Database Schema (PostgreSQL)

### `core_athlete`
| Field | Type | Modifiers / Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | Primary Key, `default=uuid4` | Unique athlete identifier |
| `first_name` | VARCHAR(100) | Not Null | Athlete first name |
| `last_name` | VARCHAR(100) | Not Null | Athlete surname |
| `date_of_birth` | DATE | Not Null | Date of birth (YYYY-MM-DD) |
| `gender` | VARCHAR(1) | Choices: `M`, `F` | Gender category |
| `primary_event` | VARCHAR(10) | Choices: `SPRINTS`, `MIDDLE`, `LONG`, `HURDLES`, `JUMPS`, `THROWS` | Primary focus discipline |
| `status` | VARCHAR(10) | Choices: `ACTIVE`, `INJURED`, `RESTING`, `INACTIVE` | Active roster status |
| `created_at` | TIMESTAMP | Auto Now Add | Record registration timestamp |
| `updated_at` | TIMESTAMP | Auto Now | Last update timestamp |

### `core_attendancelog`
| Field | Type | Modifiers / Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | Primary Key, `default=uuid4` | Log record identifier |
| `athlete` | FK (`core_athlete`) | `on_delete=CASCADE`, `related_name='attendance_logs'` | Parent athlete reference |
| `date` | DATE | Not Null | Date of session |
| `status` | VARCHAR(10) | Choices: `PRESENT`, `ABSENT`, `EXCUSED` | Session presence |
| `session_type` | VARCHAR(10) | Choices: `TRACK`, `LONG_RUN`, `TEMPO`, `STRENGTH`, `RECOVERY` | Modality |
| `duration_minutes` | INTEGER | Positive, Default: 60 | Total session time |
| `rpe` | INTEGER | `validators=[1..10]` | Borg CR10 Exertion Scale |
| *Constraint* | Composite Unique | `unique_together = ('athlete', 'date')` | One session log per athlete/day |
| *Property* | `session_workload` | Computed: `duration_minutes * rpe` | Workload in Arbitrary Units (AU) |

### `core_raceperformance`
| Field | Type | Modifiers / Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | Primary Key, `default=uuid4` | Performance record identifier |
| `athlete` | FK (`core_athlete`) | `on_delete=CASCADE`, `related_name='race_performances'` | Parent athlete reference |
| `event_name` | VARCHAR(10) | Choices: `100m`, `200m`, `400m`, `800m`, `1500m`, `5000m`, `10km`, `21.1km` | Track/Road event |
| `date` | DATE | Not Null | Competition date |
| `recorded_time_seconds` | DECIMAL(8,2) | Not Null | Recorded finish time |
| `asa_standard_seconds` | DECIMAL(8,2) | Not Null | Target qualification benchmark |
| *Property* | `delta_seconds` | Computed: `recorded_time - asa_standard` | Time gap to standard |

---

## 3. Sports Science Mathematical Formulations

### 3.1 Session Rating of Perceived Exertion (sRPE)
$$\text{Session Workload (AU)} = \text{Duration (minutes)} \times \text{RPE (1--10)}$$

### 3.2 Acute:Chronic Workload Ratio (Gabbett Model)
For a continuous 28-day timeline referencing target date $t$:

$$\text{Acute Workload (7d)} = \frac{\sum_{i=0}^{6} \text{Workload}(t - i)}{7}$$

$$\text{Chronic Workload (28d)} = \frac{\sum_{i=0}^{27} \text{Workload}(t - i)}{28}$$

$$\text{ACWR} = \frac{\text{Acute Workload}}{\text{Chronic Workload}} \quad (\text{if Chronic} > 0)$$

### 3.3 Gabbett Risk Classifications
* **Under-trained ($\text{ACWR} < 0.8$):** Low fitness stimulus; increased relative injury risk when returning to competition loads.
* **Sweet Spot ($0.8 \le \text{ACWR} \le 1.3$):** Optimal training zone; high fitness accumulation with lowest relative injury risk.
* **Elevated Risk ($1.3 < \text{ACWR} \le 1.5$):** Training load spike alert; requires recovery monitoring.
* **High Danger ($\text{ACWR} > 1.5$):** Severe spike zone; exponential increase in soft-tissue injury risk; immediate taper required.

---

## 4. REST API Endpoint Specification

| Method | Endpoint | Description | Query Parameters |
| :--- | :--- | :--- | :--- |
| `GET` / `POST` | `/api/athletes/` | Roster list & creation | `?status=ACTIVE`, `?primary_event=SPRINTS`, `?search=` |
| `GET` / `PUT` | `/api/athletes/{id}/` | Athlete detail & updates | — |
| `GET` / `POST` | `/api/attendance/` | Daily attendance / sRPE logs | `?athlete={id}`, `?date=YYYY-MM-DD` |
| `GET` / `POST` | `/api/performances/` | Race marks & ASA comparisons | `?athlete={id}`, `?event_name=800m` |
| `GET` | `/api/analytics/workload/{id}/` | 28-day ACWR & daily trend series | `?date=YYYY-MM-DD` (optional, defaults to today) |