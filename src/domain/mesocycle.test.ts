import { describe, expect, it } from "vitest"
import {
  Mesocycle,
  currentWeek,
  isDeloadWeek,
  isDeloadElapsed,
  prescribedSetCount,
  deloadStartedAt,
} from "./mesocycle"

const days = (n: number) => n * 24 * 60 * 60 * 1000

function meso(startedAt: Date, weekLength = 5): Mesocycle {
  return { id: "m1", startedAt: startedAt.toISOString(), weekLength, status: "active" }
}

describe("currentWeek", () => {
  const t0 = new Date("2026-01-05T08:00:00Z")
  it("week 1 on start day", () => {
    expect(currentWeek(meso(t0), t0)).toBe(1)
  })
  it("week 1 six days later", () => {
    expect(currentWeek(meso(t0), new Date(t0.getTime() + days(6)))).toBe(1)
  })
  it("week 2 on day 7", () => {
    expect(currentWeek(meso(t0), new Date(t0.getTime() + days(7)))).toBe(2)
  })
  it("week 5 on day 28", () => {
    expect(currentWeek(meso(t0), new Date(t0.getTime() + days(28)))).toBe(5)
  })
  it("week 6 (deload) on day 35", () => {
    expect(currentWeek(meso(t0), new Date(t0.getTime() + days(35)))).toBe(6)
  })
})

describe("isDeloadWeek", () => {
  const t0 = new Date("2026-01-05T08:00:00Z")
  it("false during weeks 1..5", () => {
    expect(isDeloadWeek(meso(t0), new Date(t0.getTime() + days(20)))).toBe(false)
  })
  it("true on week weekLength+1", () => {
    expect(isDeloadWeek(meso(t0), new Date(t0.getTime() + days(35)))).toBe(true)
  })
  it("false again after deload week elapsed (week > weekLength+1)", () => {
    expect(isDeloadWeek(meso(t0), new Date(t0.getTime() + days(42)))).toBe(false)
  })
})

describe("isDeloadElapsed", () => {
  const t0 = new Date("2026-01-05T08:00:00Z")
  it("false during deload week", () => {
    expect(isDeloadElapsed(meso(t0), new Date(t0.getTime() + days(35)))).toBe(false)
  })
  it("true after deload week", () => {
    expect(isDeloadElapsed(meso(t0), new Date(t0.getTime() + days(42)))).toBe(true)
  })
})

describe("prescribedSetCount", () => {
  const t0 = new Date("2026-01-05T08:00:00Z")
  const ex = { baseSetCount: 3, peakSetCount: 5 }
  it("returns base in week 1", () => {
    expect(prescribedSetCount(ex, meso(t0), t0)).toBe(3)
  })
  it("returns peak in final week", () => {
    expect(prescribedSetCount(ex, meso(t0), new Date(t0.getTime() + days(28)))).toBe(5)
  })
  it("interpolates linearly mid-way", () => {
    expect(prescribedSetCount(ex, meso(t0), new Date(t0.getTime() + days(14)))).toBe(4)
  })
  it("returns half (ceil) during deload week", () => {
    expect(prescribedSetCount(ex, meso(t0), new Date(t0.getTime() + days(35)))).toBe(2)
  })
  it("minimum 1 set on deload", () => {
    expect(prescribedSetCount({ baseSetCount: 1, peakSetCount: 2 }, meso(t0), new Date(t0.getTime() + days(35)))).toBe(1)
  })
})

describe("deloadStartedAt", () => {
  it("returns a date such that the derived week equals weekLength+1 today", () => {
    const today = new Date("2026-02-09T08:00:00Z")
    const newStartedAt = deloadStartedAt(today, 5)
    const m: Mesocycle = { id: "m1", startedAt: newStartedAt.toISOString(), weekLength: 5, status: "active" }
    expect(currentWeek(m, today)).toBe(6)
  })
})
