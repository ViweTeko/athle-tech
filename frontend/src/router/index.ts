/**
 * frontend/src/router/index.ts
 *
 * Vue Router configuration for Athle-Tech.
 * Maps application routes directly to feature components in src/components/.
 */

import { createRouter, createWebHistory } from 'vue-router'
import WorkloadDashboard from '../analytics/WorkloadDashboard.vue'
import AthleteRoster from '../components/athletes/AthleteRoster.vue'

const routes = [
  {
    path: '/',
    name: 'Dashboard',
    component: WorkloadDashboard,
  },
  {
    path: '/athletes',
    name: 'Athletes',
    component: AthleteRoster,
  },
  {
    path: '/attendance',
    name: 'Attendance',
    component: () => import('../components/attendance/AttendanceLogger.vue'),
  },
  {
    path: '/performance',
    name: 'Performance',
    component: () => import('../components/performance/PerformanceTracker.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router