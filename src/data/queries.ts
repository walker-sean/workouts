import { db, LoggedWorkout } from "./db"
import { LastSession } from "../domain/progression"
import { Mesocycle } from "../domain/mesocycle"
import { Settings } from "./db"
import { PlannedExercise, WorkoutDay } from "../domain/plan"

export async function getActiveMesocycle(): Promise<Mesocycle | undefined> {
  return db.mesocycles.where("status").equals("active").first()
}

export async function getSettings(): Promise<Settings | undefined> {
  return db.settings.get("singleton")
}

export async function getPlannedExercisesForDay(day: WorkoutDay): Promise<PlannedExercise[]> {
  const all = await db.plannedExercises.where("day").equals(day).toArray()
  return all.sort((a, b) => a.order - b.order)
}

export async function lastSessionForExercise(plannedExerciseId: string): Promise<LastSession | null> {
  const finished = await db.loggedWorkouts
    .filter(w => !!w.finishedAt && w.exercises.some(e => e.plannedExerciseId === plannedExerciseId))
    .toArray()
  if (finished.length === 0) return null
  finished.sort((a, b) => (b.finishedAt ?? "").localeCompare(a.finishedAt ?? ""))
  const exercise = finished[0].exercises.find(e => e.plannedExerciseId === plannedExerciseId)!
  return { sets: exercise.sets.map(({ weight, reps, rir }) => ({ weight, reps, rir })) }
}

export async function historyForExercise(plannedExerciseId: string): Promise<LastSession[]> {
  const finished = await db.loggedWorkouts
    .filter(w => !!w.finishedAt && w.exercises.some(e => e.plannedExerciseId === plannedExerciseId))
    .toArray()
  finished.sort((a, b) => (a.finishedAt ?? "").localeCompare(b.finishedAt ?? "")) // oldest -> newest
  return finished.map(w => {
    const ex = w.exercises.find(e => e.plannedExerciseId === plannedExerciseId)!
    return { sets: ex.sets.map(({ weight, reps, rir }) => ({ weight, reps, rir })) }
  })
}

export async function recentSessions(limit: number): Promise<LoggedWorkout[]> {
  const finished = await db.loggedWorkouts.filter(w => !!w.finishedAt).toArray()
  finished.sort((a, b) => (b.finishedAt ?? "").localeCompare(a.finishedAt ?? ""))
  return finished.slice(0, limit)
}

export async function getInProgressWorkout(): Promise<LoggedWorkout | undefined> {
  return db.loggedWorkouts.filter(w => !w.finishedAt).first()
}
