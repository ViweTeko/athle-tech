# Athle-Tech Frontend Application

Welcome to the **Athle-Tech** frontend application codebase. This web application provides a high-performance, real-time dashboard for athletic coaches to monitor roster statistics, log athlete workload/RPE scores, and track performance deltas against national ASA qualifying benchmarks.

---

## 1. Project Overview & Purpose

**Athle-Tech** bridges sports science metrics with intuitive coaching workflows. The frontend is engineered as a single-page application (SPA) designed to:
- **Streamline Daily Logging:** Allow coaches to input post-session workload and attendance in under 60 seconds.
- **Provide Visual Roster Intelligence:** Filter athletes by age categories (`U16`, `U18`, `U20`, `Senior`) and disciplines (`Track & Field`, `Cross Country`, `Road`).
- **Surface Injury Alerts:** Visualize Acute-to-Chronic Workload Ratio (ACWR) warnings when workload spikes exceed safe thresholds.

---

## 2. Technology Stack & Design System

- **Framework:** [Vue 3](https://vuejs.org/) using the Composition API (`<script setup lang="ts">`).
- **Language:** [TypeScript](https://www.typescriptlang.org/) for strict type safety and auto-completion.
- **Build Tool:** [Vite](https://vitejs.dev/) for lightning-fast module replacement (HMR) and production builds.
- **Styling:** Custom Vanilla CSS featuring modern design elements:
  - Sleek dark theme palette (`#0b0f19` canvas, `#0f172a` surfaces)
  - Glassmorphic backdrop blurring (`backdrop-filter: blur(...)`)
  - Dynamic micro-animations and glowing discipline badges
  - Fully responsive grid layouts across mobile, tablet, and desktop viewports

---

## 3. Directory Structure

```text
frontend/
├── index.html              # Main HTML document entry point
├── package.json            # Dependencies, scripts, and package metadata
├── tsconfig.json           # Strict TypeScript compiler configuration
├── vite.config.ts          # Vite build tool and dev server configuration
├── README.md               # Frontend documentation (this file)
└── src/
    ├── main.ts             # Application bootstrapper & Vue app instantiation
    ├── App.vue             # Root layout shell & global toast notification harness
    ├── style.css           # Global CSS variables, reset rules, and base dark theme
    ├── components/
    │   └── AthleteRoster.vue # Screen 1: Athlete Roster Grid & Discipline Filters
    └── types/
        └── athlete.ts      # TypeScript interfaces, enums, and display label constants
```

---

## 4. Backend Connections & System Integration

### What It Connects To
The frontend connects directly to the **Django REST Framework (DRF)** backend API endpoints:
- **`GET /api/athletes/`**: Fetches the list of registered athletes and discipline metadata.
- **`GET /api/athletes/?discipline=TRACK_FIELD`**: Queries filtered athlete subsets.
- **`POST /api/attendance/`**: Submits session attendance logs and RPE ratings.
- **`GET /api/athletes/{id}/workload/`**: Fetches computed ACWR ratios and load trend data.

### Why This Decoupled Architecture?
1. **Speed & UX Responsiveness:** Client-side rendering enables instant text searching, live pill filtering, and zero-latency UI state transitions without page reloads.
2. **Separation of Concerns:** The Vue frontend handles view presentation, user interactions, and visual accessibility, while Django manages database persistence (PostgreSQL), authentication, and computational algorithms (e.g., 7-day vs. 28-day ACWR load ratios).
3. **Graceful Fallbacks:** Components like `AthleteRoster.vue` include fallback mock datasets allowing frontend development and UI testing to continue independently even when backend services are offline.

---

## 5. Development Setup & Available Scripts

### Prerequisites
- Node.js (v18.0.0 or higher recommended)
- npm or pnpm

### Commands

```bash
# Navigate to the frontend directory
cd frontend

# Install project dependencies
npm install

# Start the Vite development server (http://localhost:3000)
npm run dev

# Perform static type checking with vue-tsc
npm run type-check

# Build for production
npm run build

# Preview production build locally
npm run preview
```
