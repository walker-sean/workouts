import { describe, expect, it } from "vitest"
import { suggestNext, ExerciseConfig, LastSession } from "./progression"

const config: ExerciseConfig = {
  repRange: [8, 10],
  rir: 2,
  increment: 5,
  defaultStartingWeight: 100,
}

describe("suggestNext", () => {
  it("returns default starting weight when no history", () => {
    expect(suggestNext(config, null)).toEqual({ weight: 100, reps: 8, rir: 2 })
  })

  it("adds weight when every set hit the top of the range", () => {
    const last: LastSession = {
      sets: [
        { weight: 100, reps: 10, rir: 2 },
        { weight: 100, reps: 10, rir: 2 },
        { weight: 100, reps: 10, rir: 2 },
      ],
    }
    expect(suggestNext(config, last)).toEqual({ weight: 105, reps: 8, rir: 2 })
  })

  it("does NOT add weight if any set missed the top", () => {
    const last: LastSession = {
      sets: [
        { weight: 100, reps: 10, rir: 2 },
        { weight: 100, reps: 9, rir: 2 },
        { weight: 100, reps: 9, rir: 2 },
      ],
    }
    expect(suggestNext(config, last)).toEqual({ weight: 100, reps: 10, rir: 2 })
  })

  it("suggests +1 rep when in the middle of the range", () => {
    const last: LastSession = {
      sets: [{ weight: 100, reps: 9, rir: 2 }],
    }
    expect(suggestNext(config, last)).toEqual({ weight: 100, reps: 10, rir: 2 })
  })

  it("clamps suggestion to bottom of range if user failed below low", () => {
    const last: LastSession = {
      sets: [
        { weight: 100, reps: 6, rir: 2 },
        { weight: 100, reps: 5, rir: 2 },
      ],
    }
    expect(suggestNext(config, last)).toEqual({ weight: 100, reps: 8, rir: 2 })
  })

  it("uses the most common weight (tie-broken by max) as the last working weight", () => {
    const last: LastSession = {
      sets: [
        { weight: 100, reps: 10, rir: 2 },
        { weight: 100, reps: 10, rir: 2 },
        { weight: 95, reps: 8, rir: 2 }, // back-off
      ],
    }
    // top set wasn't ALL at 100 reaching 10 — actually yes, the 100 sets hit 10, but
    // the back-off set is at 95. The function judges by sets at the modal weight.
    expect(suggestNext(config, last)).toEqual({ weight: 105, reps: 8, rir: 2 })
  })
})
