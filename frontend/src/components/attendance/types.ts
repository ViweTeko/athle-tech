export type SessionType = 'TRACK' | 'TEMPO' | 'GYM' | 'LONG_RUN'
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'INJURED'

export interface AttendanceEntry {
    athleteId: string
    fullName: string
    category: string
    sessionType: SessionType
    status: AttendanceStatus
    durationMinutes: number
    rpe: number // 1 to 10
    acute7DaySum: number // Rolling 7-day workload (RPE * mins)
    chronic28DayAvg: number // Weekly average workload over 28 days
}