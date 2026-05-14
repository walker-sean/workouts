import Dexie, { Table } from "dexie"
import { PlannedExercise, WorkoutDay, SEEDED_PLAN } from "../domain/plan"
import { Mesocycle } from "../domain/mesocycle"
import { LoggedSetData } from "../domain/progression"

export type LoggedSet = LoggedSetData & { loggedAt: string }

export type LoggedExercise = {
  plannedExerciseId: string
  nameAtTime: string
  sets: LoggedSet[]
  swappedFromId?: string
}

export type LoggedWorkout = {
  id: string
  day: WorkoutDay
  date: string                    // YYYY-MM-DD
  mesocycleId: string
  week: number
  isDeload: boolean
  exercises: LoggedExercise[]
  finishedAt?: string             // ISO datetime
}

export type Settings = {
  id: "singleton"                 // there's only ever one
  units: "lb" | "kg"
  warmupMobilityItems: string[]
  defaultRestCompound: number
  defaultRestIsolation: number
  rotationPointer: number         // 0..3 index into WORKOUT_ROTATION
  firstRunDone: boolean
}

class WorkoutsDB extends Dexie {
  plannedExercises!: Table<PlannedExercise, string>
  mesocycles!: Table<Mesocycle, string>
  loggedWorkouts!: Table<LoggedWorkout, string>
  settings!: Table<Settings, string>

  constructor() {
    super("workouts")
    this.version(1).stores({
      plannedExercises: "id, day, order",
      mesocycles: "id, status, startedAt",
      loggedWorkouts: "id, date, day, mesocycleId, finishedAt",
      settings: "id",
    })
  }
}

export const db = new WorkoutsDB()

export async function seedIfEmpty(): Promise<void> {
  await db.transaction("rw", db.plannedExercises, db.mesocycles, db.settings, async () => {
    const existing = await db.plannedExercises.count()
    if (existing > 0) return

    await db.plannedExercises.bulkAdd(SEEDED_PLAN.map(e => ({ ...e })))

    await db.mesocycles.add({
      id: cryptoRandomId(),
      startedAt: new Date().toISOString(),
      weekLength: 5,
      status: "active",
    })

    await db.settings.add({
      id: "singleton",
      units: "lb",
      warmupMobilityItems: [
        "Arm circles",
        "Leg swings",
        "Hip openers",
        "Thoracic rotations",
        "Scap pull-aparts",
      ],
      defaultRestCompound: 150,
      defaultRestIsolation: 75,
      rotationPointer: 0,
      firstRunDone: false,
    })
  })
}

export function cryptoRandomId(): string {
  return crypto.randomUUID()
}
