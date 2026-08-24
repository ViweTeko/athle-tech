export type EventCategory = '100m' | '200m' | '400m' | '800m' | '1500m' | '5000m' | '10km' | '21.1km'

export interface RaceResult {
    id: string
    athleteId: string
    athleteName: string
    eventName: EventCategory
    date: string
    recordedTimeSeconds: number // e.g. 112.40 (1:52.40)
    asaStandardSeconds: number  // e.g. 108.00 (1:48.00)
}