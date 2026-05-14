export type LoggedSetData = { weight: number; reps: number; rir: number }

export type LastSession = {
  sets: LoggedSetData[]
}

export type ExerciseConfig = {
  repRange: [number, number]
  rir: number
  increment: number
  defaultStartingWeight: number
}

export type Suggestion = { weight: number; reps: number; rir: number }

export function suggestNext(config: ExerciseConfig, last: LastSession | null): Suggestion {
  const [low, high] = config.repRange

  if (!last || last.sets.length === 0) {
    return { weight: config.defaultStartingWeight, reps: low, rir: config.rir }
  }

  const workingWeight = modalWeight(last.sets)
  const setsAtWorkingWeight = last.sets.filter(s => s.weight === workingWeight)
  const worstReps = Math.min(...setsAtWorkingWeight.map(s => s.reps))
  const allHitTop = setsAtWorkingWeight.every(s => s.reps >= high)

  if (allHitTop) {
    return { weight: workingWeight + config.increment, reps: low, rir: config.rir }
  }
  if (worstReps < low) {
    return { weight: workingWeight, reps: low, rir: config.rir }
  }
  return { weight: workingWeight, reps: Math.min(worstReps + 1, high), rir: config.rir }
}

// Sessions array is oldest -> newest. Returns the number of consecutive sessions
// at the tail with NO improvement (neither weight nor reps went up vs the prior session).
export function countStall(sessions: LastSession[]): number {
  let stalls = 0
  for (let i = sessions.length - 1; i > 0; i--) {
    const cur = aggregate(sessions[i])
    const prev = aggregate(sessions[i - 1])
    if (cur.weight > prev.weight) break
    if (cur.weight === prev.weight && cur.totalReps > prev.totalReps) break
    stalls++
  }
  return stalls
}

function aggregate(session: LastSession) {
  const weights = session.sets.map(s => s.weight)
  const weight = Math.max(...weights)
  const totalReps = session.sets
    .filter(s => s.weight === weight)
    .reduce((sum, s) => sum + s.reps, 0)
  return { weight, totalReps }
}

function modalWeight(sets: LoggedSetData[]): number {
  const counts = new Map<number, number>()
  for (const s of sets) counts.set(s.weight, (counts.get(s.weight) ?? 0) + 1)
  let bestWeight = sets[0].weight
  let bestCount = 0
  for (const [weight, count] of counts) {
    if (count > bestCount || (count === bestCount && weight > bestWeight)) {
      bestWeight = weight
      bestCount = count
    }
  }
  return bestWeight
}
