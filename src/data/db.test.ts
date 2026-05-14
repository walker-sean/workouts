import { beforeEach, describe, expect, it } from "vitest"
import { db, seedIfEmpty } from "./db"
import { SEEDED_PLAN } from "../domain/plan"

describe("db", () => {
  beforeEach(async () => {
    await db.delete()
    await db.open()
  })

  it("seeds the plan on first run", async () => {
    await seedIfEmpty()
    const rows = await db.plannedExercises.toArray()
    expect(rows).toHaveLength(SEEDED_PLAN.length)
  })

  it("does not duplicate seed on second run", async () => {
    await seedIfEmpty()
    await seedIfEmpty()
    const rows = await db.plannedExercises.toArray()
    expect(rows).toHaveLength(SEEDED_PLAN.length)
  })

  it("creates a mesocycle on first run", async () => {
    await seedIfEmpty()
    const cycles = await db.mesocycles.toArray()
    expect(cycles).toHaveLength(1)
    expect(cycles[0].status).toBe("active")
  })

  it("creates default settings on first run", async () => {
    await seedIfEmpty()
    const settings = await db.settings.toArray()
    expect(settings).toHaveLength(1)
    expect(settings[0].units).toBe("lb")
    expect(settings[0].rotationPointer).toBe(0)
  })
})
