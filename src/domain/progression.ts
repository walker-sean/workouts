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
