import { describe, expect, it } from "vitest"
import { rampUpSets } from "./warmup"

describe("rampUpSets", () => {
  it("computes 50/70/85/95 percentages of working weight", () => {
    const sets = rampUpSets(150)
    expect(sets).toEqual([
      { weight: 75, reps: 8 },
      { weight: 105, reps: 5 },
      { weight: 127.5, reps: 3 },
      { weight: 142.5, reps: 1 },
    ])
  })

  it("rounds each weight to nearest 2.5", () => {
    const sets = rampUpSets(135)
    expect(sets.map(s => s.weight)).toEqual([67.5, 95, 115, 127.5])
    // 50%=67.5, 70%=94.5→95, 85%=114.75→115, 95%=128.25→127.5
  })

  it("handles zero (bodyweight exercise) -> all zeros", () => {
    expect(rampUpSets(0)).toEqual([
      { weight: 0, reps: 8 },
      { weight: 0, reps: 5 },
      { weight: 0, reps: 3 },
      { weight: 0, reps: 1 },
    ])
  })
})
