import { describe, expect, it } from "vitest"
import { roundToIncrement, lbToKg, kgToLb } from "./units"

describe("roundToIncrement", () => {
  it("rounds 127.5 to nearest 2.5 -> 127.5", () => {
    expect(roundToIncrement(127.5, 2.5)).toBe(127.5)
  })
  it("rounds 128 to nearest 2.5 -> 127.5", () => {
    expect(roundToIncrement(128, 2.5)).toBe(127.5)
  })
  it("rounds 129 to nearest 2.5 -> 130", () => {
    expect(roundToIncrement(129, 2.5)).toBe(130)
  })
  it("rounds 6.5 to nearest 5 -> 5", () => {
    expect(roundToIncrement(6.5, 5)).toBe(5)
  })
  it("rounds 7.5 to nearest 5 -> 10", () => {
    expect(roundToIncrement(7.5, 5)).toBe(10)
  })
})

describe("lb/kg conversion", () => {
  it("lbToKg(220) ~= 99.79", () => {
    expect(lbToKg(220)).toBeCloseTo(99.79, 1)
  })
  it("kgToLb(100) ~= 220.46", () => {
    expect(kgToLb(100)).toBeCloseTo(220.46, 1)
  })
})
