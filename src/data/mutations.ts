import { db, LoggedWorkout, LoggedSet, cryptoRandomId } from "./db"
import { getActiveMesocycle, getPlannedExercisesForDay, getSettings, getInProgressWorkout } from "./queries"
import { WORKOUT_ROTATION } from "../domain/plan"
import { Mesocycle, currentWeek, isDeloadWeek, deloadStartedAt } from "../domain/mesocycle"

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

export async function swapExercise(
  workoutId: string,
  currentPlannedExerciseId: string,
  swap: { newPlannedExerciseId: string; newName: string },
): Promise<void> {
  const workout = await db.loggedWorkouts.get(workoutId)
  if (!workout) throw new Error(`Workout ${workoutId} not found`)
  const ex = workout.exercises.find(e => e.plannedExerciseId === currentPlannedExerciseId)
  if (!ex) throw new Error(`Exercise ${currentPlannedExerciseId} not in workout`)
  ex.swappedFromId = ex.plannedExerciseId
  ex.plannedExerciseId = swap.newPlannedExerciseId
  ex.nameAtTime = swap.newName
  ex.sets = [] // fresh slate for the swapped-in exercise
  await db.loggedWorkouts.put(workout)
}

export async function startDeloadNow(): Promise<void> {
  const m = await getActiveMesocycle()
  if (!m) throw new Error("No active mesocycle")
  const newStart = deloadStartedAt(new Date(), m.weekLength)
  await db.mesocycles.update(m.id, { startedAt: newStart.toISOString() })
}

export async function resetMesocycle(): Promise<void> {
  await db.transaction("rw", db.mesocycles, async () => {
    const m = await getActiveMesocycle()
    if (m) await db.mesocycles.update(m.id, { status: "completed" })
    const fresh: Mesocycle = {
      id: cryptoRandomId(),
      startedAt: new Date().toISOString(),
      weekLength: m?.weekLength ?? 5,
      status: "active",
    }
    await db.mesocycles.add(fresh)
  })
}

export async function completeMesocycleAndStartNew(): Promise<void> {
  await resetMesocycle()
}
