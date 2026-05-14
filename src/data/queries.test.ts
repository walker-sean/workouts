import { beforeEach, describe, expect, it } from "vitest"
import { db, seedIfEmpty } from "./db"
import { lastSessionForExercise, getActiveMesocycle, getSettings, recentSessions } from "./queries"

beforeEach(async () => {
  await db.delete()
  await db.open()
  await seedIfEmpty()
})

describe("getActiveMesocycle", () => {
  it("returns the single active mesocycle", async () => {
    const m = await getActiveMesocycle()
    expect(m).toBeDefined()
    expect(m?.status).toBe("active")
  })
})

describe("getSettings", () => {
  it("returns the singleton settings row", async () => {
    const s = await getSettings()
    expect(s?.units).toBe("lb")
  })
})

describe("lastSessionForExercise", () => {
  it("returns null when no history", async () => {
    expect(await lastSessionForExercise("ua-smith-bench")).toBeNull()
  })

  it("returns the most recent finished session containing the exercise", async () => {
    await db.loggedWorkouts.bulkAdd([
      {
        id: "w1", day: "UpperA", date: "2026-05-10", mesocycleId: "m", week: 1, isDeload: false,
        finishedAt: "2026-05-10T09:00:00Z",
        exercises: [
          { plannedExerciseId: "ua-smith-bench", nameAtTime: "Smith Bench", sets: [{ weight: 95, reps: 8, rir: 2, loggedAt: "2026-05-10T09:00:00Z" }] },
        ],
      },
      {
        id: "w2", day: "UpperA", date: "2026-05-13", mesocycleId: "m", week: 1, isDeload: false,
        finishedAt: "2026-05-13T09:00:00Z",
        exercises: [
          { plannedExerciseId: "ua-smith-bench", nameAtTime: "Smith Bench", sets: [{ weight: 100, reps: 8, rir: 2, loggedAt: "2026-05-13T09:00:00Z" }] },
        ],
      },
    ])
    const last = await lastSessionForExercise("ua-smith-bench")
    expect(last?.sets[0].weight).toBe(100)
  })

  it("ignores in-progress workouts (no finishedAt)", async () => {
    await db.loggedWorkouts.add({
      id: "w-pending", day: "UpperA", date: "2026-05-14", mesocycleId: "m", week: 1, isDeload: false,
      exercises: [{ plannedExerciseId: "ua-smith-bench", nameAtTime: "Smith Bench", sets: [{ weight: 999, reps: 1, rir: 0, loggedAt: "2026-05-14T09:00:00Z" }] }],
    })
    expect(await lastSessionForExercise("ua-smith-bench")).toBeNull()
  })
})

describe("recentSessions", () => {
  it("returns finished sessions, newest first, limited", async () => {
    await db.loggedWorkouts.bulkAdd([
      { id: "a", day: "UpperA", date: "2026-05-10", mesocycleId: "m", week: 1, isDeload: false, finishedAt: "2026-05-10T09:00:00Z", exercises: [] },
      { id: "b", day: "LowerA", date: "2026-05-11", mesocycleId: "m", week: 1, isDeload: false, finishedAt: "2026-05-11T09:00:00Z", exercises: [] },
      { id: "c", day: "UpperB", date: "2026-05-13", mesocycleId: "m", week: 1, isDeload: false, finishedAt: "2026-05-13T09:00:00Z", exercises: [] },
    ])
    const got = await recentSessions(2)
    expect(got.map(w => w.id)).toEqual(["c", "b"])
  })
})
