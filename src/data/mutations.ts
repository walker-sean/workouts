import { db, LoggedWorkout, LoggedSet, cryptoRandomId } from "./db"
import { getActiveMesocycle, getPlannedExercisesForDay, getSettings, getInProgressWorkout } from "./queries"
import { WORKOUT_ROTATION } from "../domain/plan"
import { currentWeek, isDeloadWeek } from "../domain/mesocycle"

export async function startWorkout(): Promise<LoggedWorkout> {
  const existing = await getInProgressWorkout()
  if (existing) return existing

  const settings = await getSettings()
  const meso = await getActiveMesocycle()
  if (!settings || !meso) throw new Error("App not seeded")

  const day = WORKOUT_ROTATION[settings.rotationPointer]
  const planned = await getPlannedExercisesForDay(day)
  const now = new Date()

  const workout: LoggedWorkout = {
    id: cryptoRandomId(),
    day,
    date: toDateString(now),
    mesocycleId: meso.id,
    week: currentWeek(meso, now),
    isDeload: isDeloadWeek(meso, now),
    exercises: planned.map(p => ({
      plannedExerciseId: p.id,
      nameAtTime: p.name,
      sets: [],
    })),
  }
  await db.loggedWorkouts.add(workout)
  return workout
}

export async function logSet(
  workoutId: string,
  plannedExerciseId: string,
  set: { weight: number; reps: number; rir: number },
): Promise<void> {
  const workout = await db.loggedWorkouts.get(workoutId)
  if (!workout) throw new Error(`Workout ${workoutId} not found`)
  const ex = workout.exercises.find(e => e.plannedExerciseId === plannedExerciseId)
  if (!ex) throw new Error(`Exercise ${plannedExerciseId} not in workout`)
  const loggedSet: LoggedSet = { ...set, loggedAt: new Date().toISOString() }
  ex.sets.push(loggedSet)
  await db.loggedWorkouts.put(workout)
}

export async function finishWorkout(workoutId: string): Promise<void> {
  await db.transaction("rw", db.loggedWorkouts, db.settings, async () => {
    const workout = await db.loggedWorkouts.get(workoutId)
    if (!workout) throw new Error(`Workout ${workoutId} not found`)
    workout.finishedAt = new Date().toISOString()
    await db.loggedWorkouts.put(workout)

    const settings = await db.settings.get("singleton")
    if (!settings) throw new Error("Settings missing")
    const next = (settings.rotationPointer + 1) % WORKOUT_ROTATION.length
    await db.settings.update("singleton", { rotationPointer: next })
  })
}

export async function discardWorkout(workoutId: string): Promise<void> {
  await db.loggedWorkouts.delete(workoutId)
}

function toDateString(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}
