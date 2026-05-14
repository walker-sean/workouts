export type Mesocycle = {
  id: string
  startedAt: string         // ISO date
  weekLength: number        // 5 or 6
  status: "active" | "completed"
}

const ONE_DAY_MS = 24 * 60 * 60 * 1000
const ONE_WEEK_MS = 7 * ONE_DAY_MS

export function currentWeek(m: Mesocycle, today: Date): number {
  const elapsedDays = Math.floor((today.getTime() - new Date(m.startedAt).getTime()) / ONE_DAY_MS)
  const week = Math.floor(elapsedDays / 7) + 1
  return Math.max(week, 1)
}

export function isDeloadWeek(m: Mesocycle, today: Date): boolean {
  return currentWeek(m, today) === m.weekLength + 1
}

export function isDeloadElapsed(m: Mesocycle, today: Date): boolean {
  return currentWeek(m, today) > m.weekLength + 1
}

export function prescribedSetCount(
  ex: { baseSetCount: number; peakSetCount: number },
  m: Mesocycle,
  today: Date,
): number {
  if (isDeloadWeek(m, today)) {
    return Math.max(1, Math.ceil(ex.baseSetCount * 0.5))
  }
  const week = currentWeek(m, today)
  const denom = Math.max(1, m.weekLength - 1)
  const t = Math.max(0, Math.min(1, (week - 1) / denom))
  return Math.round(ex.baseSetCount + t * (ex.peakSetCount - ex.baseSetCount))
}

// Returns the startedAt date that would make `today` fall in the deload week.
export function deloadStartedAt(today: Date, weekLength: number): Date {
  return new Date(today.getTime() - weekLength * ONE_WEEK_MS)
}
