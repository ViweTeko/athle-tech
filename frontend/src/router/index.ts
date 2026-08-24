import { createRouter, createWebHistory } from 'vue-router'
import AthleteRoster from '../components/AthleteRoster.vue'
import AttendanceLogger from '../components/attendance/AttendanceLogger.vue'

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
            // Lazy-loaded placeholder for Screen 3
            component: () => import('../components/PerformanceTracker.vue')
        }
    ]
})

export default router