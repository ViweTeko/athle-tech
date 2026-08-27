# Athle-Tech Frontend Client

The frontend client for Athle-Tech, built as a single-page application using **Vue 3 (Composition API)**, **TypeScript**, and **Vite**.

---

## 📂 Frontend Architecture

The codebase utilizes a domain-driven, feature-based folder layout:

```text
frontend/src/
├── analytics/                      # Workload Analytics & ACWR Domain
│   ├── useAnalytics.ts             # API client for backend 28-day ACWR calculations
│   └── WorkloadDashboard.vue       # SVG ACWR gauge, trend bars, and risk alerts
├── components/
│   ├── athletes/                   # Athlete Management Domain
│   │   ├── types.ts                # Athlete interfaces & discipline enum types
│   │   ├── useAthletes.ts          # Client-side filtering & headcount composable
│   │   ├── AthleteCard.vue         # Individual athlete presentation card
│   │   ├── AthleteRoster.vue       # Screen 1 container with Add Modal & Grid
│   │   └── RosterToolbar.vue       # Search & multi-discipline filter pills
│   ├── attendance/                 # Attendance & Workload Logging Domain
│   │   ├── types.ts                # Session & attendance interfaces
│   │   ├── useAttendance.ts        # Attendance composable hook
│   │   ├── AttendanceLogger.vue    # Screen 2: sRPE range slider & logger
│   │   ├── AttendanceTableRow.vue  # Table row component
│   │   └── SessionSetupBar.vue     # Global session configuration header
│   └── performance/                # Competition Performance Domain
│       ├── types.ts                # Race performance & ASA standard types
│       ├── usePerformance.ts       # PB evaluation and ASA delta composable
│       ├── PerformanceCard.vue     # Result card with PB / ASA qualifying badges
│       ├── PerformanceTracker.vue  # Screen 3 container
│       └── ResultEntryForm.vue     # Result entry form supporting track & field
├── router/
│   └── index.ts                    # Vue Router 4 route map
├── utils/
│   └── formatters.ts               # Name initials and date formatters
├── App.vue                         # Main layout shell with sticky navbar & toast harness
├── main.ts                         # Application bootstrapper
└── style.css                       # Modern dark-theme design system
🧭 Navigation Routes/ $\rightarrow$ WorkloadDashboard.vue (ACWR Gauges & 28-day load history)/athletes $\rightarrow$ AthleteRoster.vue (Roster management & registration)/attendance $\rightarrow$ AttendanceLogger.vue (Daily sRPE session logging)/performance $\rightarrow$ PerformanceTracker.vue (Multi-event PB & ASA standards tracker)🛠️ Development SetupBashcd frontend

# Install dependencies
npm install

# Start Vite dev server (Port 3000)
npm run dev

# Run TypeScript validation
npm run type-check

# Build for production
npm run build