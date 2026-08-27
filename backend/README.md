# Athle-Tech Backend Engine

The backend service for Athle-Tech, built with **Django 6.1** and **Django REST Framework (DRF)** over **PostgreSQL**.

---

## 📂 Backend Architecture

```text
backend/
├── config/                  # Project configuration & settings
│   ├── settings.py          # Database, CORS, and DRF middleware configuration
│   ├── urls.py              # Root router mounting `/api/`
│   ├── asgi.py & wsgi.py
├── core/                    # Core athletic domain application
│   ├── management/commands/ # Custom CLI commands (seed_data.py)
│   ├── migrations/          # PostgreSQL migration files
│   ├── models.py            # Athlete, AttendanceLog, RacePerformance schemas
│   ├── serializers.py       # Model serializers with computed workloads & deltas
│   ├── views.py             # ModelViewSets and AthleteWorkloadAnalyticsView
│   ├── urls.py              # Application-level routing
│   ├── admin.py             # Django Admin interfaces
│   └── tests.py             # 10/10 passing unit test suite
├── .env.example             # Template for environment secrets
├── manage.py
└── requirements.txt
🛠️ Local Setup
Activate Virtual Environment:

Bash
cd backend
python -m venv .venv
source .venv/bin/activate
Install Dependencies:

Bash
pip install -r requirements.txt
Configure Environment:

Bash
cp .env.example .env
Ensure DB_NAME, DB_USER, DB_PASSWORD, DB_HOST, and DB_PORT match your PostgreSQL instance.

Migrate & Seed Database:

Bash
python manage.py migrate
python manage.py seed_data
Start DRF Development Server:

Bash
python manage.py runserver 8000
🧪 Automated Testing
Run the full API test suite:

Bash
python manage.py test core