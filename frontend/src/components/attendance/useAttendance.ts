import { ref, computed } from 'vue'
import type { AttendanceEntry, SessionType } from './types'

export function useAttendance() {
  const sessionDate = ref(new Date().toISOString().split('T')[0])
  const globalSessionType = ref<SessionType>('TRACK')
  const globalDuration = ref(60)

  const attendanceList = ref<AttendanceEntry[]>([
    {
      athleteId: '1',
      fullName: 'Sipho Ndlovu',
      category: 'U20',
      sessionType: 'TRACK',
      status: 'PRESENT',
      durationMinutes: 60,
      rpe: 8,
      acute7DaySum: 2400,
      chronic28DayAvg: 1400
    },
    {
      athleteId: '2',
      fullName: 'Anathi Mabena',
      category: 'U17',
      sessionType: 'TRACK',
      status: 'PRESENT',
      durationMinutes: 45,
      rpe: 6,
      acute7DaySum: 1500,
      chronic28DayAvg: 1300
    },
    {
      athleteId: '3',
      fullName: 'Lethabo Molefe',
      category: 'Senior',
      sessionType: 'GYM',
      status: 'INJURED',
      durationMinutes: 0,
      rpe: 1,
      acute7DaySum: 400,
      chronic28DayAvg: 1600
    }
  ])

  // ACWR Math Logic
  function calculateACWR(acute: number, chronic: number): number {
    if (!chronic || chronic === 0) return 0
    return Number((acute / chronic).toFixed(2))
  }

  function getACWRBadgeClass(acwr: number): string {
    if (acwr > 1.5) return 'bg-red-100 text-red-800 border-red-200'
    if (acwr >= 0.8 && acwr <= 1.3) return 'bg-green-100 text-green-800 border-green-200'
    if (acwr > 1.3 && acwr <= 1.5) return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    return 'bg-blue-100 text-blue-800 border-blue-200'
  }

  // Batch updates
  function applyGlobalSettings() {
    attendanceList.value.forEach((entry) => {
      entry.sessionType = globalSessionType.value
      if (entry.status === 'PRESENT') {
        entry.durationMinutes = globalDuration.value
      }
    })
  }

  // Reactive Indicators
  const highRiskCount = computed(() => {
    return attendanceList.value.filter(
      (entry) => calculateACWR(entry.acute7DaySum, entry.chronic28DayAvg) > 1.5
    ).length
  })

  const totalPresent = computed(() => {
    return attendanceList.value.filter((entry) => entry.status === 'PRESENT').length
  })

  return {
    sessionDate,
    globalSessionType,
    globalDuration,
    attendanceList,
    highRiskCount,
    totalPresent,
    calculateACWR,
    getACWRBadgeClass,
    applyGlobalSettings
  }
}