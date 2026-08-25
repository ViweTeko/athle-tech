import { ref } from 'vue'
import type { RaceResult } from './types'

/**
 * Custom Vue composable hook to manage athletic race results, format durations,
 * calculate benchmarking deltas, and insert new performance records.
 * 
 * @returns Reactively tracked state variables, conversion methods, and list mutations.
 */
export function usePerformance() {
    const results = ref<RaceResult[]>([
        {
            id: '1',
            athleteId: '101',
            athleteName: 'Sipho Ndlovu',
            eventName: '800m',
            date: '2026-08-15',
            recordedTimeSeconds: 112.4, // 1:52.40
            asaStandardSeconds: 108.0   // 1:48.00 (Target)
        },
        {
            id: '2',
            athleteId: '102',
            athleteName: 'Anathi Mabena',
            eventName: '1500m',
            date: '2026-08-18',
            recordedTimeSeconds: 238.1, // 3:58.10
            asaStandardSeconds: 232.0   // 3:52.00 (Target)
        }
    ])

    // Convert seconds to MM:SS.ms string display
    function formatSecondsToTime(totalSeconds: number): string {
        const mins = Math.floor(totalSeconds / 60)
        const secs = (totalSeconds % 60).toFixed(2)
        return mins > 0
            ? `${mins}:${Number(secs) < 10 ? '0' : ''}${secs}`
            : `${secs}s`
    }

    // Delta calculation: recorded - target (positive = seconds off target)
    function calculateDelta(recorded: number, target: number): { seconds: string; percentage: number } {
        const diff = recorded - target
        const percentage = Math.min(Number(((target / recorded) * 100).toFixed(1)), 100)
        return {
            seconds: diff > 0 ? `+${diff.toFixed(2)}s` : `${diff.toFixed(2)}s`,
            percentage
        }
    }

    function addResult(newResult: Omit<RaceResult, 'id'>) {
        results.value.unshift({
            ...newResult,
            id: Date.now().toString()
        })
    }

    return {
        results,
        formatSecondsToTime,
        calculateDelta,
        addResult
    }
}