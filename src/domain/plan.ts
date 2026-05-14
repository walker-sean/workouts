export type WorkoutDay = "UpperA" | "LowerA" | "UpperB" | "LowerB"
export const WORKOUT_ROTATION: ReadonlyArray<WorkoutDay> = ["UpperA", "LowerA", "UpperB", "LowerB"]

export type PlannedExercise = {
  id: string
  day: WorkoutDay
  order: number
  name: string
  category: string
  baseSetCount: number
  peakSetCount: number
  repRange: [number, number]
  rir: number
  restSeconds: number
  increment: number
  isOpeningCompound: boolean
  defaultStartingWeight: number
  notes?: string
}

// All weights in lb. Numbers chosen on the conservative side — double progression
// will find the user's real working weight in 1-2 sessions.
export const SEEDED_PLAN: PlannedExercise[] = [
  // Upper A
  { id: "ua-smith-bench",      day: "UpperA", order: 1, name: "Smith Machine Bench Press",     category: "horizontal-press", baseSetCount: 3, peakSetCount: 4, repRange: [6, 8],   rir: 2, restSeconds: 150, increment: 5,   isOpeningCompound: true,  defaultStartingWeight: 95 },
  { id: "ua-neutral-pulldown", day: "UpperA", order: 2, name: "Neutral-Grip Lat Pulldown",     category: "vertical-pull",    baseSetCount: 3, peakSetCount: 4, repRange: [8, 10],  rir: 2, restSeconds: 150, increment: 5,   isOpeningCompound: false, defaultStartingWeight: 80 },
  { id: "ua-incline-db-press", day: "UpperA", order: 3, name: "Incline DB Press",              category: "horizontal-press", baseSetCount: 2, peakSetCount: 3, repRange: [8, 12],  rir: 1, restSeconds: 120, increment: 5,   isOpeningCompound: false, defaultStartingWeight: 30 },
  { id: "ua-cs-row",           day: "UpperA", order: 4, name: "Chest-Supported Row",           category: "horizontal-pull",  baseSetCount: 2, peakSetCount: 3, repRange: [10, 12], rir: 1, restSeconds: 120, increment: 5,   isOpeningCompound: false, defaultStartingWeight: 70 },
  { id: "ua-cable-lat-raise",  day: "UpperA", order: 5, name: "Cable Lateral Raise",           category: "side-delt",        baseSetCount: 3, peakSetCount: 4, repRange: [12, 15], rir: 1, restSeconds: 75,  increment: 2.5, isOpeningCompound: false, defaultStartingWeight: 10 },
  { id: "ua-incline-db-curl",  day: "UpperA", order: 6, name: "Incline DB Curl",               category: "biceps",           baseSetCount: 2, peakSetCount: 3, repRange: [10, 12], rir: 1, restSeconds: 75,  increment: 2.5, isOpeningCompound: false, defaultStartingWeight: 15 },
  { id: "ua-overhead-tri",     day: "UpperA", order: 7, name: "Overhead Cable Triceps",        category: "triceps",          baseSetCount: 2, peakSetCount: 3, repRange: [10, 15], rir: 1, restSeconds: 75,  increment: 2.5, isOpeningCompound: false, defaultStartingWeight: 30 },

  // Lower A
  { id: "la-hack-squat",       day: "LowerA", order: 1, name: "Hack Squat",                    category: "quad-compound",    baseSetCount: 3, peakSetCount: 4, repRange: [6, 8],   rir: 2, restSeconds: 180, increment: 10,  isOpeningCompound: true,  defaultStartingWeight: 90 },
  { id: "la-db-rdl",           day: "LowerA", order: 2, name: "DB Romanian Deadlift",          category: "hinge",            baseSetCount: 2, peakSetCount: 3, repRange: [8, 10],  rir: 2, restSeconds: 150, increment: 5,   isOpeningCompound: false, defaultStartingWeight: 35 },
  { id: "la-leg-press",        day: "LowerA", order: 3, name: "Leg Press",                     category: "quad-compound",    baseSetCount: 2, peakSetCount: 3, repRange: [10, 12], rir: 1, restSeconds: 150, increment: 10,  isOpeningCompound: false, defaultStartingWeight: 180 },
  { id: "la-leg-ext",          day: "LowerA", order: 4, name: "Leg Extension",                 category: "quad-isolation",   baseSetCount: 3, peakSetCount: 4, repRange: [12, 15], rir: 0, restSeconds: 90,  increment: 5,   isOpeningCompound: false, defaultStartingWeight: 70 },
  { id: "la-standing-calf",    day: "LowerA", order: 5, name: "Standing Calf Raise",           category: "calves",           baseSetCount: 3, peakSetCount: 4, repRange: [8, 12],  rir: 0, restSeconds: 90,  increment: 5,   isOpeningCompound: false, defaultStartingWeight: 90 },
  { id: "la-hanging-leg",      day: "LowerA", order: 6, name: "Hanging Leg Raise",             category: "abs",              baseSetCount: 2, peakSetCount: 3, repRange: [10, 15], rir: 1, restSeconds: 75,  increment: 0,   isOpeningCompound: false, defaultStartingWeight: 0 },

  // Upper B
  { id: "ub-db-ohp",           day: "UpperB", order: 1, name: "Seated DB Shoulder Press",      category: "vertical-press",   baseSetCount: 3, peakSetCount: 4, repRange: [6, 10],  rir: 2, restSeconds: 150, increment: 5,   isOpeningCompound: true,  defaultStartingWeight: 25 },
  { id: "ub-hammer-row",       day: "UpperB", order: 2, name: "Hammer Strength Row",           category: "horizontal-pull",  baseSetCount: 3, peakSetCount: 4, repRange: [8, 10],  rir: 2, restSeconds: 150, increment: 5,   isOpeningCompound: false, defaultStartingWeight: 70 },
  { id: "ub-machine-press",    day: "UpperB", order: 3, name: "Machine Chest Press",           category: "horizontal-press", baseSetCount: 2, peakSetCount: 3, repRange: [8, 12],  rir: 1, restSeconds: 120, increment: 5,   isOpeningCompound: false, defaultStartingWeight: 70 },
  { id: "ub-lat-pulldown",     day: "UpperB", order: 4, name: "Lat Pulldown",                  category: "vertical-pull",    baseSetCount: 2, peakSetCount: 3, repRange: [10, 12], rir: 1, restSeconds: 120, increment: 5,   isOpeningCompound: false, defaultStartingWeight: 80 },
  { id: "ub-db-lat-raise",     day: "UpperB", order: 5, name: "DB Lateral Raise",              category: "side-delt",        baseSetCount: 3, peakSetCount: 4, repRange: [12, 20], rir: 1, restSeconds: 75,  increment: 2.5, isOpeningCompound: false, defaultStartingWeight: 12.5 },
  { id: "ub-rev-pec",          day: "UpperB", order: 6, name: "Reverse Pec Deck",              category: "rear-delt",        baseSetCount: 2, peakSetCount: 3, repRange: [15, 20], rir: 1, restSeconds: 75,  increment: 5,   isOpeningCompound: false, defaultStartingWeight: 40 },
  { id: "ub-preacher-curl",    day: "UpperB", order: 7, name: "Preacher Curl Machine",         category: "biceps",           baseSetCount: 2, peakSetCount: 3, repRange: [8, 12],  rir: 1, restSeconds: 75,  increment: 5,   isOpeningCompound: false, defaultStartingWeight: 40 },
  { id: "ub-tri-pushdown",     day: "UpperB", order: 8, name: "Triceps Pushdown",              category: "triceps",          baseSetCount: 2, peakSetCount: 3, repRange: [12, 15], rir: 0, restSeconds: 75,  increment: 5,   isOpeningCompound: false, defaultStartingWeight: 40 },

  // Lower B
  { id: "lb-trap-deadlift",    day: "LowerB", order: 1, name: "Trap Bar Deadlift",             category: "hinge-compound",   baseSetCount: 3, peakSetCount: 3, repRange: [5, 5],   rir: 3, restSeconds: 180, increment: 10,  isOpeningCompound: true,  defaultStartingWeight: 135 },
  { id: "lb-bulg-split",       day: "LowerB", order: 2, name: "DB Bulgarian Split Squat",      category: "unilateral-leg",   baseSetCount: 2, peakSetCount: 3, repRange: [8, 10],  rir: 2, restSeconds: 120, increment: 5,   isOpeningCompound: false, defaultStartingWeight: 20 },
  { id: "lb-seated-curl",      day: "LowerB", order: 3, name: "Seated Leg Curl",               category: "hamstring",        baseSetCount: 3, peakSetCount: 4, repRange: [10, 12], rir: 0, restSeconds: 90,  increment: 5,   isOpeningCompound: false, defaultStartingWeight: 60 },
  { id: "lb-hip-thrust",       day: "LowerB", order: 4, name: "DB Hip Thrust",                 category: "glute",            baseSetCount: 2, peakSetCount: 3, repRange: [8, 12],  rir: 1, restSeconds: 120, increment: 5,   isOpeningCompound: false, defaultStartingWeight: 30 },
  { id: "lb-seated-calf",      day: "LowerB", order: 5, name: "Seated Calf Raise",             category: "calves",           baseSetCount: 3, peakSetCount: 4, repRange: [10, 15], rir: 0, restSeconds: 90,  increment: 5,   isOpeningCompound: false, defaultStartingWeight: 45 },
  { id: "lb-cable-crunch",     day: "LowerB", order: 6, name: "Cable Crunch",                  category: "abs",              baseSetCount: 2, peakSetCount: 3, repRange: [10, 15], rir: 1, restSeconds: 75,  increment: 5,   isOpeningCompound: false, defaultStartingWeight: 50 },
]
