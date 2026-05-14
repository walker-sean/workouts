import { roundToIncrement } from "./units"

export type RampUpSet = { weight: number; reps: number }

const RAMP_UP_PERCENTAGES: ReadonlyArray<{ pct: number; reps: number }> = [
  { pct: 0.50, reps: 8 },
  { pct: 0.70, reps: 5 },
  { pct: 0.85, reps: 3 },
  { pct: 0.95, reps: 1 },
]

export function rampUpSets(workingWeight: number): RampUpSet[] {
  return RAMP_UP_PERCENTAGES.map(({ pct, reps }) => ({
    weight: roundToIncrement(workingWeight * pct, 2.5),
    reps,
  }))
}
