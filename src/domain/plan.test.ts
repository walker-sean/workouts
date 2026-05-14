import { describe, expect, it } from "vitest"
import { SEEDED_PLAN, WORKOUT_ROTATION } from "./plan"

describe("SEEDED_PLAN", () => {
  it("has exercises for all 4 workout days", () => {
    const days = new Set(SEEDED_PLAN.map(e => e.day))
    expect(days).toEqual(new Set(WORKOUT_ROTATION))
  })

  it("has unique ids", () => {
    const ids = SEEDED_PLAN.map(e => e.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it("each day has exactly one opening compound", () => {
    for (const day of WORKOUT_ROTATION) {
      const openers = SEEDED_PLAN.filter(e => e.day === day && e.isOpeningCompound)
      expect(openers, `day ${day} should have 1 opening compound, got ${openers.length}`).toHaveLength(1)
    }
  })

  it("each day has its opening compound first by order", () => {
    for (const day of WORKOUT_ROTATION) {
      const dayExercises = SEEDED_PLAN.filter(e => e.day === day).sort((a, b) => a.order - b.order)
      expect(dayExercises[0].isOpeningCompound).toBe(true)
    }
  })

  it("peakSetCount >= baseSetCount for every exercise", () => {
    for (const e of SEEDED_PLAN) {
      expect(e.peakSetCount, `${e.name}`).toBeGreaterThanOrEqual(e.baseSetCount)
    }
  })

  it("repRange[1] >= repRange[0]", () => {
    for (const e of SEEDED_PLAN) {
      expect(e.repRange[1], `${e.name}`).toBeGreaterThanOrEqual(e.repRange[0])
    }
  })
})
