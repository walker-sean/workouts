import { beforeEach, describe, expect, it } from "vitest"
import { db, seedIfEmpty } from "./db"
import { startWorkout, logSet, finishWorkout } from "./mutations"
import { getInProgressWorkout, recentSessions } from "./queries"

beforeEach(async () => {
  await db.delete()
  await db.open()
  await seedIfEmpty()
})

describe("startWorkout", () => {
  it("creates a new in-progress workout for the next day in rotation", async () => {
    const w = await startWorkout()
    expect(w.day).toBe("UpperA")
    expect(w.finishedAt).toBeUndefined()
    expect(w.exercises.length).toBeGreaterThan(0)
    const inProg = await getInProgressWorkout()
    expect(inProg?.id).toBe(w.id)
  })

  it("returns the existing in-progress workout if one exists", async () => {
    const a = await startWorkout()
    const b = await startWorkout()
    expect(b.id).toBe(a.id)
  })
})

describe("logSet", () => {
  it("appends a set to the named exercise in the in-progress workout", async () => {
    const w = await startWorkout()
    await logSet(w.id, "ua-smith-bench", { weight: 95, reps: 8, rir: 2 })
    const updated = await db.loggedWorkouts.get(w.id)
    const ex = updated!.exercises.find(e => e.plannedExerciseId === "ua-smith-bench")!
    expect(ex.sets).toHaveLength(1)
    expect(ex.sets[0].weight).toBe(95)
  })
})

describe("finishWorkout", () => {
  it("marks finishedAt and advances rotation pointer", async () => {
    const w = await startWorkout()
    await finishWorkout(w.id)
    const updated = await db.loggedWorkouts.get(w.id)
    expect(updated?.finishedAt).toBeDefined()
    const settings = await db.settings.get("singleton")
    expect(settings?.rotationPointer).toBe(1)
  })

  it("rotation pointer wraps from 3 to 0", async () => {
    await db.settings.update("singleton", { rotationPointer: 3 })
    const w = await startWorkout()
    expect(w.day).toBe("LowerB")
    await finishWorkout(w.id)
    const settings = await db.settings.get("singleton")
    expect(settings?.rotationPointer).toBe(0)
  })

  it("appears in recentSessions after finishing", async () => {
    const w = await startWorkout()
    await finishWorkout(w.id)
    const recent = await recentSessions(5)
    expect(recent.map(r => r.id)).toContain(w.id)
  })
})
