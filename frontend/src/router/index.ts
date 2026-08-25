import { createRouter, createWebHistory } from 'vue-router'
import AthleteRoster from '../components/athletes/AthleteRoster.vue'
import AttendanceLogger from '../components/attendance/AttendanceLogger.vue'
import PerformanceTracker from '../components/performance/PerformanceTracker.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/athletes'
    },
    {
      path: '/athletes',
      name: 'Athletes',
      component: AthleteRoster
    },
    {
      path: '/attendance',
      name: 'Attendance',
      component: AttendanceLogger
    },
    {
      path: '/performance',
      name: 'Performance',
      component: PerformanceTracker
    }
  ]
})

export default router