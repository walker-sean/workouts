# Workout Tracker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an iPhone-installable PWA that guides the user through a Planet-Fitness-adapted Upper/Lower 4-day mesocycle with double progression, rest timer, and offline IndexedDB storage.

**Architecture:** Pure-function domain layer (no React, no DB) for progression / mesocycle / warmup math. Dexie-backed data layer with React Query for read/write coordination. Three-tab React UI (Today / History / Plan). Service worker via vite-plugin-pwa for offline + Add-to-Home-Screen. Deploys to Cloudflare Pages.

**Tech Stack:** React 18, TypeScript, Vite, Vitest, React Testing Library, Dexie 4, @tanstack/react-query 5, vite-plugin-pwa, fake-indexeddb (tests).

**Spec:** `docs/superpowers/specs/2026-05-14-workout-tracker-design.md`

---

## Conventions used in this plan

- **All paths are relative to repo root.**
- **TDD pattern for domain/data:** write failing test → run, see it fail → implement → run, see it pass → commit. UI tasks use manual verification + one workout-flow smoke test at the end.
- **Commits use Conventional Commits.** Each task ends with a single commit.
- **Code blocks contain the literal file contents or diff.** When a step says "modify file X", the block shows the lines to change or the full new file.

---

## Task 1: Scaffold the Vite + React + TS project

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`, `index.html`, `src/main.tsx`, `src/app.tsx`, `.gitignore`, `README.md`

- [ ] **Step 1: Initialize package.json**

```bash
npm create vite@latest . -- --template react-ts
```

When prompted "Current directory is not empty", choose "Ignore files and continue".

- [ ] **Step 2: Install dependencies**

```bash
npm install
```

- [ ] **Step 3: Add a `.gitignore` if not present**

Ensure `.gitignore` contains:

```
node_modules
dist
dist-ssr
*.local
.DS_Store
.vite
coverage
```

- [ ] **Step 4: Verify dev server runs**

```bash
npm run dev
```

Expected: server starts on `http://localhost:5173`, opening it shows the Vite + React starter page. Stop the server (Ctrl+C).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: scaffold Vite + React + TS project"
```

---

## Task 2: Add Vitest + RTL + supporting dev dependencies

**Files:**
- Modify: `package.json`, `vite.config.ts`
- Create: `vitest.setup.ts`

- [ ] **Step 1: Install test dependencies**

```bash
npm install --save-dev vitest @vitest/ui jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event fake-indexeddb
```

- [ ] **Step 2: Create `vitest.setup.ts`**

```ts
import "@testing-library/jest-dom/vitest"
import "fake-indexeddb/auto"
```

- [ ] **Step 3: Update `vite.config.ts`**

Replace contents with:

```ts
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    globals: true,
  },
})
```

If the `defineConfig` import errors on the `test` key, change the import to `import { defineConfig } from "vitest/config"`.

- [ ] **Step 4: Add test script to `package.json`**

In the `"scripts"` block, add:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 5: Write a sanity-check test**

Create `src/sanity.test.ts`:

```ts
import { describe, expect, it } from "vitest"

describe("sanity", () => {
  it("runs", () => {
    expect(1 + 1).toBe(2)
  })
})
```

- [ ] **Step 6: Run tests**

```bash
npm test
```

Expected: 1 passing test. Delete `src/sanity.test.ts` afterward — it was only to verify the test runner works.

```bash
rm src/sanity.test.ts
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: add Vitest + React Testing Library"
```

---

## Task 3: Install runtime dependencies (Dexie, React Query, PWA plugin)

**Files:** `package.json`

- [ ] **Step 1: Install**

```bash
npm install dexie dexie-react-hooks @tanstack/react-query
npm install --save-dev vite-plugin-pwa workbox-window
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "chore: add Dexie, React Query, vite-plugin-pwa"
```

---

## Task 4: Domain — units & rounding helpers

**Files:**
- Create: `src/domain/units.ts`
- Test: `src/domain/units.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/domain/units.test.ts`:

```ts
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
```

- [ ] **Step 2: Run, see it fail**

```bash
npm test
```

Expected: failures because `./units` doesn't exist.

- [ ] **Step 3: Implement**

Create `src/domain/units.ts`:

```ts
export function roundToIncrement(value: number, increment: number): number {
  return Math.round(value / increment) * increment
}

const LB_PER_KG = 2.20462262

export function lbToKg(lb: number): number {
  return lb / LB_PER_KG
}

export function kgToLb(kg: number): number {
  return kg * LB_PER_KG
}
```

- [ ] **Step 4: Run, see it pass**

```bash
npm test
```

Expected: 7 passing.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(domain): add units rounding and lb/kg conversion"
```

---

## Task 5: Domain — warmup ramp-up calculation

**Files:**
- Create: `src/domain/warmup.ts`
- Test: `src/domain/warmup.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/domain/warmup.test.ts`:

```ts
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
```

- [ ] **Step 2: Run, see it fail**

```bash
npm test
```

- [ ] **Step 3: Implement**

Create `src/domain/warmup.ts`:

```ts
import { roundToIncrement } from "./units"

export type RampUpSet = { weight: number; reps: number }

const RAMP_UP_PERCENTAGES: ReadonlyArray<{ pct: number; reps: number }> = [
  { pct: 0.50, reps: 8 },
  { pct: 0.70, reps: 5 },
  { pct: 0.85, reps: 3 },
  { pct: 0.95, reps: 1 },
]

export function rampUpSets(workingWeight: number): RampUpSet[] {
  return RAMP_UP_PERCENTAGES.map(({ pct, reps }) => ({
    weight: roundToIncrement(workingWeight * pct, 2.5),
    reps,
  }))
}
```

- [ ] **Step 4: Run, see it pass**

```bash
npm test
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(domain): add warmup ramp-up calculation"
```

---

## Task 6: Domain — double progression

**Files:**
- Create: `src/domain/progression.ts`
- Test: `src/domain/progression.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/domain/progression.test.ts`:

```ts
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
```

- [ ] **Step 2: Run, see it fail**

```bash
npm test
```

- [ ] **Step 3: Implement**

Create `src/domain/progression.ts`:

```ts
export type LoggedSetData = { weight: number; reps: number; rir: number }

export type LastSession = {
  sets: LoggedSetData[]
}

export type ExerciseConfig = {
  repRange: [number, number]
  rir: number
  increment: number
  defaultStartingWeight: number
}

export type Suggestion = { weight: number; reps: number; rir: number }

export function suggestNext(config: ExerciseConfig, last: LastSession | null): Suggestion {
  const [low, high] = config.repRange

  if (!last || last.sets.length === 0) {
    return { weight: config.defaultStartingWeight, reps: low, rir: config.rir }
  }

  const workingWeight = modalWeight(last.sets)
  const setsAtWorkingWeight = last.sets.filter(s => s.weight === workingWeight)
  const worstReps = Math.min(...setsAtWorkingWeight.map(s => s.reps))
  const allHitTop = setsAtWorkingWeight.every(s => s.reps >= high)

  if (allHitTop) {
    return { weight: workingWeight + config.increment, reps: low, rir: config.rir }
  }
  if (worstReps < low) {
    return { weight: workingWeight, reps: low, rir: config.rir }
  }
  return { weight: workingWeight, reps: Math.min(worstReps + 1, high), rir: config.rir }
}

function modalWeight(sets: LoggedSetData[]): number {
  const counts = new Map<number, number>()
  for (const s of sets) counts.set(s.weight, (counts.get(s.weight) ?? 0) + 1)
  let bestWeight = sets[0].weight
  let bestCount = 0
  for (const [weight, count] of counts) {
    if (count > bestCount || (count === bestCount && weight > bestWeight)) {
      bestWeight = weight
      bestCount = count
    }
  }
  return bestWeight
}
```

- [ ] **Step 4: Run, see it pass**

```bash
npm test
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(domain): add double-progression suggestNext"
```

---

## Task 7: Domain — stall detection

**Files:**
- Modify: `src/domain/progression.ts`
- Modify: `src/domain/progression.test.ts`

- [ ] **Step 1: Add failing tests**

Append to `src/domain/progression.test.ts`:

```ts
import { countStall } from "./progression"

describe("countStall", () => {
  it("returns 0 with no history", () => {
    expect(countStall([])).toBe(0)
  })

  it("returns 0 if last session improved", () => {
    const sessions = [
      { sets: [{ weight: 100, reps: 9, rir: 2 }] },
      { sets: [{ weight: 100, reps: 10, rir: 2 }] }, // improved reps
    ]
    expect(countStall(sessions)).toBe(0)
  })

  it("counts consecutive sessions with no improvement", () => {
    const sessions = [
      { sets: [{ weight: 100, reps: 8, rir: 2 }] },
      { sets: [{ weight: 100, reps: 8, rir: 2 }] }, // no change
      { sets: [{ weight: 100, reps: 8, rir: 2 }] }, // no change
    ]
    expect(countStall(sessions)).toBe(2)
  })

  it("resets when weight goes up", () => {
    const sessions = [
      { sets: [{ weight: 100, reps: 8, rir: 2 }] },
      { sets: [{ weight: 100, reps: 8, rir: 2 }] },
      { sets: [{ weight: 105, reps: 8, rir: 2 }] }, // bumped
    ]
    expect(countStall(sessions)).toBe(0)
  })
})
```

- [ ] **Step 2: Run, see fail**

```bash
npm test
```

- [ ] **Step 3: Add the implementation**

Append to `src/domain/progression.ts`:

```ts
// Sessions array is oldest -> newest. Returns the number of consecutive sessions
// at the tail with NO improvement (neither weight nor reps went up vs the prior session).
export function countStall(sessions: LastSession[]): number {
  let stalls = 0
  for (let i = sessions.length - 1; i > 0; i--) {
    const cur = aggregate(sessions[i])
    const prev = aggregate(sessions[i - 1])
    if (cur.weight > prev.weight) break
    if (cur.weight === prev.weight && cur.totalReps > prev.totalReps) break
    stalls++
  }
  return stalls
}

function aggregate(session: LastSession) {
  const weights = session.sets.map(s => s.weight)
  const weight = Math.max(...weights)
  const totalReps = session.sets
    .filter(s => s.weight === weight)
    .reduce((sum, s) => sum + s.reps, 0)
  return { weight, totalReps }
}
```

- [ ] **Step 4: Run, see pass**

```bash
npm test
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(domain): add countStall for stall detection"
```

---

## Task 8: Domain — mesocycle math

**Files:**
- Create: `src/domain/mesocycle.ts`
- Test: `src/domain/mesocycle.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/domain/mesocycle.test.ts`:

```ts
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
```

- [ ] **Step 2: Run, see fail**

```bash
npm test
```

- [ ] **Step 3: Implement**

Create `src/domain/mesocycle.ts`:

```ts
export type Mesocycle = {
  id: string
  startedAt: string         // ISO date
  weekLength: number        // 5 or 6
  status: "active" | "completed"
}

const ONE_DAY_MS = 24 * 60 * 60 * 1000
const ONE_WEEK_MS = 7 * ONE_DAY_MS

export function currentWeek(m: Mesocycle, today: Date): number {
  const elapsedDays = Math.floor((today.getTime() - new Date(m.startedAt).getTime()) / ONE_DAY_MS)
  const week = Math.floor(elapsedDays / 7) + 1
  return Math.max(week, 1)
}

export function isDeloadWeek(m: Mesocycle, today: Date): boolean {
  return currentWeek(m, today) === m.weekLength + 1
}

export function isDeloadElapsed(m: Mesocycle, today: Date): boolean {
  return currentWeek(m, today) > m.weekLength + 1
}

export function prescribedSetCount(
  ex: { baseSetCount: number; peakSetCount: number },
  m: Mesocycle,
  today: Date,
): number {
  if (isDeloadWeek(m, today)) {
    return Math.max(1, Math.ceil(ex.baseSetCount * 0.5))
  }
  const week = currentWeek(m, today)
  const denom = Math.max(1, m.weekLength - 1)
  const t = Math.max(0, Math.min(1, (week - 1) / denom))
  return Math.round(ex.baseSetCount + t * (ex.peakSetCount - ex.baseSetCount))
}

// Returns the startedAt date that would make `today` fall in the deload week.
export function deloadStartedAt(today: Date, weekLength: number): Date {
  return new Date(today.getTime() - weekLength * ONE_WEEK_MS)
}
```

- [ ] **Step 4: Run, see pass**

```bash
npm test
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(domain): add mesocycle week math, deload trigger, set count"
```

---

## Task 9: Domain — deload weight and RIR adjustments

**Files:**
- Modify: `src/domain/mesocycle.ts`
- Modify: `src/domain/mesocycle.test.ts`

- [ ] **Step 1: Add failing tests**

Append to `src/domain/mesocycle.test.ts`:

```ts
import { deloadWeight, deloadRir } from "./mesocycle"

describe("deloadWeight", () => {
  it("returns 60% of working weight, rounded to 2.5", () => {
    expect(deloadWeight(150)).toBe(90)
  })
  it("rounds: 60% of 137.5 = 82.5", () => {
    expect(deloadWeight(137.5)).toBe(82.5)
  })
  it("60% of 100 = 60", () => {
    expect(deloadWeight(100)).toBe(60)
  })
})

describe("deloadRir", () => {
  it("adds 1 to base RIR", () => {
    expect(deloadRir(2)).toBe(3)
    expect(deloadRir(0)).toBe(1)
  })
})
```

- [ ] **Step 2: Run, see fail**

- [ ] **Step 3: Append implementation to `src/domain/mesocycle.ts`**

```ts
import { roundToIncrement } from "./units"

export function deloadWeight(workingWeight: number): number {
  return roundToIncrement(workingWeight * 0.6, 2.5)
}

export function deloadRir(baseRir: number): number {
  return baseRir + 1
}
```

- [ ] **Step 4: Run, see pass**

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(domain): add deload weight and RIR adjustments"
```

---

## Task 10: Domain — the seeded PF-adapted plan

**Files:**
- Create: `src/domain/plan.ts`
- Test: `src/domain/plan.test.ts`

- [ ] **Step 1: Define the planned-exercise type and seeded plan**

Create `src/domain/plan.ts`:

```ts
export type WorkoutDay = "UpperA" | "LowerA" | "UpperB" | "LowerB"
export const WORKOUT_ROTATION: ReadonlyArray<WorkoutDay> = ["UpperA", "LowerA", "UpperB", "LowerB"]

export type PlannedExercise = {
  id: string
  day: WorkoutDay
  order: number
  name: string
  category: string
  baseSetCount: number
  peakSetCount: number
  repRange: [number, number]
  rir: number
  restSeconds: number
  increment: number
  isOpeningCompound: boolean
  defaultStartingWeight: number
  notes?: string
}

// All weights in lb. Numbers chosen on the conservative side — double progression
// will find the user's real working weight in 1-2 sessions.
export const SEEDED_PLAN: PlannedExercise[] = [
  // Upper A
  { id: "ua-smith-bench",      day: "UpperA", order: 1, name: "Smith Machine Bench Press",     category: "horizontal-press", baseSetCount: 3, peakSetCount: 4, repRange: [6, 8],   rir: 2, restSeconds: 150, increment: 5,   isOpeningCompound: true,  defaultStartingWeight: 95 },
  { id: "ua-neutral-pulldown", day: "UpperA", order: 2, name: "Neutral-Grip Lat Pulldown",     category: "vertical-pull",    baseSetCount: 3, peakSetCount: 4, repRange: [8, 10],  rir: 2, restSeconds: 150, increment: 5,   isOpeningCompound: false, defaultStartingWeight: 80 },
  { id: "ua-incline-db-press", day: "UpperA", order: 3, name: "Incline DB Press",              category: "horizontal-press", baseSetCount: 2, peakSetCount: 3, repRange: [8, 12],  rir: 1, restSeconds: 120, increment: 5,   isOpeningCompound: false, defaultStartingWeight: 30 },
  { id: "ua-cs-row",           day: "UpperA", order: 4, name: "Chest-Supported Row",           category: "horizontal-pull",  baseSetCount: 2, peakSetCount: 3, repRange: [10, 12], rir: 1, restSeconds: 120, increment: 5,   isOpeningCompound: false, defaultStartingWeight: 70 },
  { id: "ua-cable-lat-raise",  day: "UpperA", order: 5, name: "Cable Lateral Raise",           category: "side-delt",        baseSetCount: 3, peakSetCount: 4, repRange: [12, 15], rir: 1, restSeconds: 75,  increment: 2.5, isOpeningCompound: false, defaultStartingWeight: 10 },
  { id: "ua-incline-db-curl",  day: "UpperA", order: 6, name: "Incline DB Curl",               category: "biceps",           baseSetCount: 2, peakSetCount: 3, repRange: [10, 12], rir: 1, restSeconds: 75,  increment: 2.5, isOpeningCompound: false, defaultStartingWeight: 15 },
  { id: "ua-overhead-tri",     day: "UpperA", order: 7, name: "Overhead Cable Triceps",        category: "triceps",          baseSetCount: 2, peakSetCount: 3, repRange: [10, 15], rir: 1, restSeconds: 75,  increment: 2.5, isOpeningCompound: false, defaultStartingWeight: 30 },

  // Lower A
  { id: "la-hack-squat",       day: "LowerA", order: 1, name: "Hack Squat",                    category: "quad-compound",    baseSetCount: 3, peakSetCount: 4, repRange: [6, 8],   rir: 2, restSeconds: 180, increment: 10,  isOpeningCompound: true,  defaultStartingWeight: 90 },
  { id: "la-db-rdl",           day: "LowerA", order: 2, name: "DB Romanian Deadlift",          category: "hinge",            baseSetCount: 2, peakSetCount: 3, repRange: [8, 10],  rir: 2, restSeconds: 150, increment: 5,   isOpeningCompound: false, defaultStartingWeight: 35 },
  { id: "la-leg-press",        day: "LowerA", order: 3, name: "Leg Press",                     category: "quad-compound",    baseSetCount: 2, peakSetCount: 3, repRange: [10, 12], rir: 1, restSeconds: 150, increment: 10,  isOpeningCompound: false, defaultStartingWeight: 180 },
  { id: "la-leg-ext",          day: "LowerA", order: 4, name: "Leg Extension",                 category: "quad-isolation",   baseSetCount: 3, peakSetCount: 4, repRange: [12, 15], rir: 0, restSeconds: 90,  increment: 5,   isOpeningCompound: false, defaultStartingWeight: 70 },
  { id: "la-standing-calf",    day: "LowerA", order: 5, name: "Standing Calf Raise",           category: "calves",           baseSetCount: 3, peakSetCount: 4, repRange: [8, 12],  rir: 0, restSeconds: 90,  increment: 5,   isOpeningCompound: false, defaultStartingWeight: 90 },
  { id: "la-hanging-leg",      day: "LowerA", order: 6, name: "Hanging Leg Raise",             category: "abs",              baseSetCount: 2, peakSetCount: 3, repRange: [10, 15], rir: 1, restSeconds: 75,  increment: 0,   isOpeningCompound: false, defaultStartingWeight: 0 },

  // Upper B
  { id: "ub-db-ohp",           day: "UpperB", order: 1, name: "Seated DB Shoulder Press",      category: "vertical-press",   baseSetCount: 3, peakSetCount: 4, repRange: [6, 10],  rir: 2, restSeconds: 150, increment: 5,   isOpeningCompound: true,  defaultStartingWeight: 25 },
  { id: "ub-hammer-row",       day: "UpperB", order: 2, name: "Hammer Strength Row",           category: "horizontal-pull",  baseSetCount: 3, peakSetCount: 4, repRange: [8, 10],  rir: 2, restSeconds: 150, increment: 5,   isOpeningCompound: false, defaultStartingWeight: 70 },
  { id: "ub-machine-press",    day: "UpperB", order: 3, name: "Machine Chest Press",           category: "horizontal-press", baseSetCount: 2, peakSetCount: 3, repRange: [8, 12],  rir: 1, restSeconds: 120, increment: 5,   isOpeningCompound: false, defaultStartingWeight: 70 },
  { id: "ub-lat-pulldown",     day: "UpperB", order: 4, name: "Lat Pulldown",                  category: "vertical-pull",    baseSetCount: 2, peakSetCount: 3, repRange: [10, 12], rir: 1, restSeconds: 120, increment: 5,   isOpeningCompound: false, defaultStartingWeight: 80 },
  { id: "ub-db-lat-raise",     day: "UpperB", order: 5, name: "DB Lateral Raise",              category: "side-delt",        baseSetCount: 3, peakSetCount: 4, repRange: [12, 20], rir: 1, restSeconds: 75,  increment: 2.5, isOpeningCompound: false, defaultStartingWeight: 12.5 },
  { id: "ub-rev-pec",          day: "UpperB", order: 6, name: "Reverse Pec Deck",              category: "rear-delt",        baseSetCount: 2, peakSetCount: 3, repRange: [15, 20], rir: 1, restSeconds: 75,  increment: 5,   isOpeningCompound: false, defaultStartingWeight: 40 },
  { id: "ub-preacher-curl",    day: "UpperB", order: 7, name: "Preacher Curl Machine",         category: "biceps",           baseSetCount: 2, peakSetCount: 3, repRange: [8, 12],  rir: 1, restSeconds: 75,  increment: 5,   isOpeningCompound: false, defaultStartingWeight: 40 },
  { id: "ub-tri-pushdown",     day: "UpperB", order: 8, name: "Triceps Pushdown",              category: "triceps",          baseSetCount: 2, peakSetCount: 3, repRange: [12, 15], rir: 0, restSeconds: 75,  increment: 5,   isOpeningCompound: false, defaultStartingWeight: 40 },

  // Lower B
  { id: "lb-trap-deadlift",    day: "LowerB", order: 1, name: "Trap Bar Deadlift",             category: "hinge-compound",   baseSetCount: 3, peakSetCount: 3, repRange: [5, 5],   rir: 3, restSeconds: 180, increment: 10,  isOpeningCompound: true,  defaultStartingWeight: 135 },
  { id: "lb-bulg-split",       day: "LowerB", order: 2, name: "DB Bulgarian Split Squat",      category: "unilateral-leg",   baseSetCount: 2, peakSetCount: 3, repRange: [8, 10],  rir: 2, restSeconds: 120, increment: 5,   isOpeningCompound: false, defaultStartingWeight: 20 },
  { id: "lb-seated-curl",      day: "LowerB", order: 3, name: "Seated Leg Curl",               category: "hamstring",        baseSetCount: 3, peakSetCount: 4, repRange: [10, 12], rir: 0, restSeconds: 90,  increment: 5,   isOpeningCompound: false, defaultStartingWeight: 60 },
  { id: "lb-hip-thrust",       day: "LowerB", order: 4, name: "DB Hip Thrust",                 category: "glute",            baseSetCount: 2, peakSetCount: 3, repRange: [8, 12],  rir: 1, restSeconds: 120, increment: 5,   isOpeningCompound: false, defaultStartingWeight: 30 },
  { id: "lb-seated-calf",      day: "LowerB", order: 5, name: "Seated Calf Raise",             category: "calves",           baseSetCount: 3, peakSetCount: 4, repRange: [10, 15], rir: 0, restSeconds: 90,  increment: 5,   isOpeningCompound: false, defaultStartingWeight: 45 },
  { id: "lb-cable-crunch",     day: "LowerB", order: 6, name: "Cable Crunch",                  category: "abs",              baseSetCount: 2, peakSetCount: 3, repRange: [10, 15], rir: 1, restSeconds: 75,  increment: 5,   isOpeningCompound: false, defaultStartingWeight: 50 },
]
```

- [ ] **Step 2: Write test for plan invariants**

Create `src/domain/plan.test.ts`:

```ts
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
```

- [ ] **Step 3: Run tests**

```bash
npm test
```

Expected: all pass.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(domain): add PF-adapted seeded plan"
```

---

## Task 11: Data layer — Dexie schema

**Files:**
- Create: `src/data/db.ts`
- Test: `src/data/db.test.ts`

- [ ] **Step 1: Write failing test**

Create `src/data/db.test.ts`:

```ts
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
```

- [ ] **Step 2: Run, see fail**

```bash
npm test
```

- [ ] **Step 3: Implement**

Create `src/data/db.ts`:

```ts
import Dexie, { Table } from "dexie"
import { PlannedExercise, SEEDED_PLAN } from "../domain/plan"
import { Mesocycle } from "../domain/mesocycle"
import { LoggedSetData } from "../domain/progression"
import { WorkoutDay } from "../domain/plan"

export type LoggedSet = LoggedSetData & { loggedAt: string }

export type LoggedExercise = {
  plannedExerciseId: string
  nameAtTime: string
  sets: LoggedSet[]
  swappedFromId?: string
}

export type LoggedWorkout = {
  id: string
  day: WorkoutDay
  date: string                    // YYYY-MM-DD
  mesocycleId: string
  week: number
  isDeload: boolean
  exercises: LoggedExercise[]
  finishedAt?: string             // ISO datetime
}

export type Settings = {
  id: "singleton"                 // there's only ever one
  units: "lb" | "kg"
  warmupMobilityItems: string[]
  defaultRestCompound: number
  defaultRestIsolation: number
  rotationPointer: number         // 0..3 index into WORKOUT_ROTATION
}

class WorkoutsDB extends Dexie {
  plannedExercises!: Table<PlannedExercise, string>
  mesocycles!: Table<Mesocycle, string>
  loggedWorkouts!: Table<LoggedWorkout, string>
  settings!: Table<Settings, string>

  constructor() {
    super("workouts")
    this.version(1).stores({
      plannedExercises: "id, day, order",
      mesocycles: "id, status, startedAt",
      loggedWorkouts: "id, date, day, mesocycleId, finishedAt",
      settings: "id",
    })
  }
}

export const db = new WorkoutsDB()

export async function seedIfEmpty(): Promise<void> {
  await db.transaction("rw", db.plannedExercises, db.mesocycles, db.settings, async () => {
    const existing = await db.plannedExercises.count()
    if (existing > 0) return

    await db.plannedExercises.bulkAdd(SEEDED_PLAN.map(e => ({ ...e })))

    await db.mesocycles.add({
      id: cryptoRandomId(),
      startedAt: new Date().toISOString(),
      weekLength: 5,
      status: "active",
    })

    await db.settings.add({
      id: "singleton",
      units: "lb",
      warmupMobilityItems: [
        "Arm circles",
        "Leg swings",
        "Hip openers",
        "Thoracic rotations",
        "Scap pull-aparts",
      ],
      defaultRestCompound: 150,
      defaultRestIsolation: 75,
      rotationPointer: 0,
    })
  })
}

export function cryptoRandomId(): string {
  return crypto.randomUUID()
}
```

- [ ] **Step 4: Run, see pass**

```bash
npm test
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(data): add Dexie schema and seed function"
```

---

## Task 12: Data layer — queries

**Files:**
- Create: `src/data/queries.ts`
- Test: `src/data/queries.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/data/queries.test.ts`:

```ts
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
```

- [ ] **Step 2: Run, see fail**

- [ ] **Step 3: Implement**

Create `src/data/queries.ts`:

```ts
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
```

- [ ] **Step 4: Run, see pass**

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(data): add read queries (mesocycle, settings, history)"
```

---

## Task 13: Data layer — mutations (workout lifecycle)

**Files:**
- Create: `src/data/mutations.ts`
- Test: `src/data/mutations.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/data/mutations.test.ts`:

```ts
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
```

- [ ] **Step 2: Run, see fail**

- [ ] **Step 3: Implement**

Create `src/data/mutations.ts`:

```ts
import { db, LoggedWorkout, LoggedSet, cryptoRandomId } from "./db"
import { getActiveMesocycle, getPlannedExercisesForDay, getSettings, getInProgressWorkout } from "./queries"
import { WORKOUT_ROTATION } from "../domain/plan"
import { currentWeek, isDeloadWeek } from "../domain/mesocycle"

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
```

- [ ] **Step 4: Run, see pass**

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(data): add workout lifecycle mutations"
```

---

## Task 14: Data layer — swap exercise and mesocycle controls

**Files:**
- Modify: `src/data/mutations.ts`
- Modify: `src/data/mutations.test.ts`

- [ ] **Step 1: Add failing tests**

Append to `src/data/mutations.test.ts`:

```ts
import { swapExercise, startDeloadNow, resetMesocycle, completeMesocycleAndStartNew } from "./mutations"
import { getActiveMesocycle } from "./queries"
import { isDeloadWeek } from "../domain/mesocycle"

describe("swapExercise", () => {
  it("replaces planned exercise id and name for a slot in the in-progress workout", async () => {
    const w = await startWorkout()
    await swapExercise(w.id, "ua-incline-db-press", { newPlannedExerciseId: "ua-machine-press-swap", newName: "Machine Chest Press (Swap)" })
    const updated = await db.loggedWorkouts.get(w.id)
    const ex = updated!.exercises.find(e => e.plannedExerciseId === "ua-machine-press-swap")!
    expect(ex.nameAtTime).toBe("Machine Chest Press (Swap)")
    expect(ex.swappedFromId).toBe("ua-incline-db-press")
  })
})

describe("startDeloadNow", () => {
  it("shifts startedAt so the derived week is deload", async () => {
    await startDeloadNow()
    const m = await getActiveMesocycle()
    expect(isDeloadWeek(m!, new Date())).toBe(true)
  })
})

describe("resetMesocycle", () => {
  it("marks current completed and starts a fresh one", async () => {
    const before = await getActiveMesocycle()
    await resetMesocycle()
    const after = await getActiveMesocycle()
    expect(after?.id).not.toBe(before?.id)
    expect(after?.status).toBe("active")
  })
})

describe("completeMesocycleAndStartNew", () => {
  it("marks current completed and creates a new active mesocycle", async () => {
    const before = await getActiveMesocycle()
    await completeMesocycleAndStartNew()
    const completed = await db.mesocycles.get(before!.id)
    expect(completed?.status).toBe("completed")
    const after = await getActiveMesocycle()
    expect(after?.id).not.toBe(before?.id)
  })
})
```

- [ ] **Step 2: Run, see fail**

- [ ] **Step 3: Append to `src/data/mutations.ts`**

```ts
import { Mesocycle, deloadStartedAt } from "../domain/mesocycle"

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
```

- [ ] **Step 4: Run, see pass**

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(data): add exercise swap and mesocycle controls"
```

---

## Task 15: App shell — providers, tab routing, first-run guard

**Files:**
- Modify: `src/main.tsx`
- Modify: `src/app.tsx`
- Create: `src/ui/AppShell.tsx`
- Create: `src/ui/tabs.tsx`
- Create: `src/ui/styles.css`

- [ ] **Step 1: Replace `src/main.tsx`**

```tsx
import React from "react"
import ReactDOM from "react-dom/client"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import App from "./app"
import "./ui/styles.css"

const qc = new QueryClient({
  defaultOptions: { queries: { staleTime: 1000 * 30, refetchOnWindowFocus: false } },
})

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={qc}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
)
```

- [ ] **Step 2: Replace `src/app.tsx`**

```tsx
import { useEffect, useState } from "react"
import { seedIfEmpty } from "./data/db"
import AppShell from "./ui/AppShell"

export default function App() {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    seedIfEmpty().then(() => setReady(true))
  }, [])
  if (!ready) return <div className="loading">Loading…</div>
  return <AppShell />
}
```

- [ ] **Step 3: Create `src/ui/AppShell.tsx`**

```tsx
import { useState } from "react"
import { TabKey, TABS } from "./tabs"
import TodayTab from "./tabs/Today"
import HistoryTab from "./tabs/History"
import PlanTab from "./tabs/Plan"

export default function AppShell() {
  const [tab, setTab] = useState<TabKey>("today")
  return (
    <div className="app-shell">
      <main className="tab-content">
        {tab === "today" && <TodayTab />}
        {tab === "history" && <HistoryTab />}
        {tab === "plan" && <PlanTab />}
      </main>
      <nav className="tab-bar" aria-label="Sections">
        {TABS.map(t => (
          <button
            key={t.key}
            className={`tab-btn ${tab === t.key ? "active" : ""}`}
            onClick={() => setTab(t.key)}
            aria-current={tab === t.key ? "page" : undefined}
          >
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  )
}
```

- [ ] **Step 4: Create `src/ui/tabs.tsx`**

```tsx
export type TabKey = "today" | "history" | "plan"
export const TABS: ReadonlyArray<{ key: TabKey; label: string }> = [
  { key: "today", label: "Today" },
  { key: "history", label: "History" },
  { key: "plan", label: "Plan" },
]
```

- [ ] **Step 5: Create `src/ui/styles.css`**

```css
:root {
  --bg: #0e0e10;
  --surface: #1a1a1d;
  --surface-2: #232328;
  --text: #f3f3f5;
  --text-dim: #a0a0a8;
  --accent: #5fb878;
  --accent-dim: #2c5a3a;
  --danger: #d96666;
  --tap: 48px;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif;
}

* { box-sizing: border-box; }
html, body, #root { margin: 0; height: 100%; background: var(--bg); color: var(--text); }
body { overscroll-behavior: contain; }

.app-shell {
  display: flex; flex-direction: column; height: 100vh;
  padding-top: env(safe-area-inset-top);
}
.tab-content { flex: 1; overflow-y: auto; padding: 16px; }
.tab-bar {
  display: flex; border-top: 1px solid var(--surface-2);
  padding-bottom: env(safe-area-inset-bottom);
  background: var(--surface);
}
.tab-btn {
  flex: 1; padding: 14px 0; background: transparent; color: var(--text-dim);
  border: 0; font-size: 15px; font-weight: 500;
  min-height: var(--tap);
}
.tab-btn.active { color: var(--accent); }

.loading { display: flex; align-items: center; justify-content: center; height: 100vh; color: var(--text-dim); }

button { font: inherit; color: inherit; cursor: pointer; }
input { font: inherit; }
```

- [ ] **Step 6: Create tab placeholder files**

```bash
mkdir -p src/ui/tabs/Today src/ui/tabs/History src/ui/tabs/Plan src/ui/components
```

Create `src/ui/tabs/Today/index.tsx`:

```tsx
export default function TodayTab() {
  return <h1>Today</h1>
}
```

Create `src/ui/tabs/History/index.tsx`:

```tsx
export default function HistoryTab() {
  return <h1>History</h1>
}
```

Create `src/ui/tabs/Plan/index.tsx`:

```tsx
export default function PlanTab() {
  return <h1>Plan</h1>
}
```

- [ ] **Step 7: Update `index.html` viewport meta**

In `index.html`, replace the existing `<meta name="viewport" ...>` tag with:

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover, maximum-scale=1.0, user-scalable=no" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<meta name="theme-color" content="#0e0e10" />
```

Also set the `<title>` to `Workouts`.

- [ ] **Step 8: Verify it runs**

```bash
npm run dev
```

Open `http://localhost:5173`. Expected: three-tab shell with "Today / History / Plan" buttons at the bottom, dark theme. Tapping each tab swaps the heading.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat(ui): add app shell with three-tab navigation"
```

---

## Task 16: Today tab — Idle view

**Files:**
- Modify: `src/ui/tabs/Today/index.tsx`
- Create: `src/ui/tabs/Today/Idle.tsx`
- Create: `src/ui/tabs/Today/useTodayState.ts`

- [ ] **Step 1: Create `src/ui/tabs/Today/useTodayState.ts`**

```ts
import { useQuery } from "@tanstack/react-query"
import { getActiveMesocycle, getInProgressWorkout, getSettings, recentSessions } from "../../../data/queries"
import { isDeloadWeek, currentWeek, isDeloadElapsed } from "../../../domain/mesocycle"
import { WORKOUT_ROTATION } from "../../../domain/plan"

export function useTodayState() {
  return useQuery({
    queryKey: ["today-state"],
    queryFn: async () => {
      const [meso, settings, inProgress, recent] = await Promise.all([
        getActiveMesocycle(),
        getSettings(),
        getInProgressWorkout(),
        recentSessions(3),
      ])
      if (!meso || !settings) throw new Error("App not seeded")
      const today = new Date()
      return {
        nextDay: WORKOUT_ROTATION[settings.rotationPointer],
        week: currentWeek(meso, today),
        weekLength: meso.weekLength,
        isDeload: isDeloadWeek(meso, today),
        deloadElapsed: isDeloadElapsed(meso, today),
        inProgress,
        recent,
      }
    },
  })
}
```

- [ ] **Step 2: Replace `src/ui/tabs/Today/index.tsx`**

```tsx
import { useTodayState } from "./useTodayState"
import Idle from "./Idle"

export default function TodayTab() {
  const q = useTodayState()
  if (q.isLoading) return <div className="loading">Loading…</div>
  if (q.isError || !q.data) return <div>Error: {String(q.error)}</div>
  if (q.data.inProgress) return <div>Active workout view (next task)</div>
  return <Idle state={q.data} />
}
```

- [ ] **Step 3: Create `src/ui/tabs/Today/Idle.tsx`**

```tsx
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { startWorkout } from "../../../data/mutations"
import type { useTodayState } from "./useTodayState"

type State = NonNullable<ReturnType<typeof useTodayState>["data"]>

const DAY_LABEL: Record<string, string> = {
  UpperA: "Upper A", LowerA: "Lower A", UpperB: "Upper B", LowerB: "Lower B",
}

export default function Idle({ state }: { state: State }) {
  const qc = useQueryClient()
  const start = useMutation({
    mutationFn: startWorkout,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["today-state"] }),
  })

  const heading = state.isDeload
    ? `Deload week — ${DAY_LABEL[state.nextDay]}`
    : `${DAY_LABEL[state.nextDay]} · Week ${state.week} of ${state.weekLength}`

  return (
    <div className="idle">
      <h1 className="idle-heading">{heading}</h1>
      <button className="primary-btn" onClick={() => start.mutate()} disabled={start.isPending}>
        {start.isPending ? "Starting…" : "Start workout"}
      </button>

      {state.recent.length > 0 && (
        <section className="recent">
          <h2 className="section-title">Recent</h2>
          <ul className="recent-list">
            {state.recent.map(w => (
              <li key={w.id} className="recent-item">
                <strong>{DAY_LABEL[w.day]}</strong>
                <span className="recent-meta">
                  {w.date} · {w.exercises.reduce((sum, e) => sum + e.sets.length, 0)} sets
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Add styles to `src/ui/styles.css`**

```css
.idle { display: flex; flex-direction: column; gap: 24px; }
.idle-heading { font-size: 24px; margin: 8px 0; font-weight: 600; }
.primary-btn {
  width: 100%; padding: 18px; background: var(--accent); color: #0a1a10;
  border: 0; border-radius: 12px; font-size: 18px; font-weight: 600;
  min-height: var(--tap);
}
.primary-btn:disabled { opacity: 0.6; }
.section-title { font-size: 13px; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 8px; }
.recent-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px; }
.recent-item { background: var(--surface); padding: 12px; border-radius: 10px; display: flex; justify-content: space-between; align-items: center; }
.recent-meta { color: var(--text-dim); font-size: 14px; }
```

- [ ] **Step 5: Manual verify in dev server**

```bash
npm run dev
```

Open the app on a phone-sized browser (DevTools → device toolbar). Expected: "Upper A · Week 1 of 5" heading, big green "Start workout" button. Tapping it transitions to "Active workout view (next task)".

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(ui): add Today tab idle state with start workout"
```

---

## Task 17: Today tab — ActiveWorkout shell

**Files:**
- Create: `src/ui/tabs/Today/ActiveWorkout.tsx`
- Modify: `src/ui/tabs/Today/index.tsx`
- Modify: `src/ui/styles.css`

- [ ] **Step 1: Create `src/ui/tabs/Today/ActiveWorkout.tsx`**

```tsx
import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { db, LoggedWorkout } from "../../../data/db"
import { finishWorkout, discardWorkout } from "../../../data/mutations"

const DAY_LABEL: Record<string, string> = {
  UpperA: "Upper A", LowerA: "Lower A", UpperB: "Upper B", LowerB: "Lower B",
}

export default function ActiveWorkout({ workout }: { workout: LoggedWorkout }) {
  const qc = useQueryClient()
  // expandedKey: "warmup" or an exercise.plannedExerciseId
  const [expanded, setExpanded] = useState<string>("warmup")

  const live = useQuery({
    queryKey: ["workout", workout.id],
    queryFn: () => db.loggedWorkouts.get(workout.id),
    initialData: workout,
  })
  const w = live.data!

  const finish = useMutation({
    mutationFn: () => finishWorkout(w.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["today-state"] })
      qc.invalidateQueries({ queryKey: ["workout", w.id] })
    },
  })

  const discard = useMutation({
    mutationFn: () => discardWorkout(w.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["today-state"] }),
  })

  return (
    <div className="active-workout">
      <header className="aw-header">
        <h1>{DAY_LABEL[w.day]} {w.isDeload && <span className="deload-tag">deload</span>}</h1>
        <button className="link-btn" onClick={() => discard.mutate()}>Discard</button>
      </header>

      <section className={`card ${expanded === "warmup" ? "expanded" : ""}`}>
        <button className="card-header" onClick={() => setExpanded(expanded === "warmup" ? "" : "warmup")}>
          Warmup
        </button>
        {expanded === "warmup" && <div className="card-body">Warmup card content (next task)</div>}
      </section>

      {w.exercises.map(ex => (
        <section key={ex.plannedExerciseId} className={`card ${expanded === ex.plannedExerciseId ? "expanded" : ""}`}>
          <button className="card-header" onClick={() => setExpanded(expanded === ex.plannedExerciseId ? "" : ex.plannedExerciseId)}>
            <span>{ex.nameAtTime}</span>
            <span className="card-meta">{ex.sets.length > 0 ? `${ex.sets.length} sets` : "—"}</span>
          </button>
          {expanded === ex.plannedExerciseId && (
            <div className="card-body">Exercise card body (next task)</div>
          )}
        </section>
      ))}

      <button className="primary-btn" onClick={() => finish.mutate()} disabled={finish.isPending}>
        {finish.isPending ? "Finishing…" : "Finish workout"}
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Update `src/ui/tabs/Today/index.tsx`**

```tsx
import { useTodayState } from "./useTodayState"
import Idle from "./Idle"
import ActiveWorkout from "./ActiveWorkout"

export default function TodayTab() {
  const q = useTodayState()
  if (q.isLoading) return <div className="loading">Loading…</div>
  if (q.isError || !q.data) return <div>Error: {String(q.error)}</div>
  if (q.data.inProgress) return <ActiveWorkout workout={q.data.inProgress} />
  return <Idle state={q.data} />
}
```

- [ ] **Step 3: Add styles**

Append to `src/ui/styles.css`:

```css
.active-workout { display: flex; flex-direction: column; gap: 12px; }
.aw-header { display: flex; align-items: center; justify-content: space-between; }
.aw-header h1 { font-size: 22px; font-weight: 600; margin: 0; }
.deload-tag { background: var(--accent-dim); color: var(--accent); font-size: 11px; padding: 2px 8px; border-radius: 999px; margin-left: 8px; vertical-align: middle; }
.link-btn { background: transparent; border: 0; color: var(--text-dim); padding: 8px; min-height: var(--tap); }

.card { background: var(--surface); border-radius: 12px; overflow: hidden; }
.card.expanded { background: var(--surface-2); }
.card-header {
  width: 100%; padding: 16px; background: transparent; border: 0;
  display: flex; justify-content: space-between; align-items: center;
  font-size: 16px; font-weight: 500; text-align: left;
  min-height: var(--tap);
}
.card-meta { color: var(--text-dim); font-size: 14px; }
.card-body { padding: 0 16px 16px; }
```

- [ ] **Step 4: Manual verify**

In dev server: tap "Start workout" → see the workout shell with warmup + exercise cards. Tap a card to expand/collapse. Tap "Finish workout" → returns to Idle, recent list now includes that workout.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(ui): add active workout shell with expand/collapse"
```

---

## Task 18: Today tab — ExerciseCard with SetRow and prefill

**Files:**
- Create: `src/ui/tabs/Today/ExerciseCard.tsx`
- Create: `src/ui/tabs/Today/SetRow.tsx`
- Modify: `src/ui/tabs/Today/ActiveWorkout.tsx`
- Modify: `src/ui/styles.css`

- [ ] **Step 1: Create `src/ui/tabs/Today/SetRow.tsx`**

```tsx
import { useState } from "react"

export type SetDraft = { weight: number; reps: number; rir: number }

export default function SetRow({
  index,
  initial,
  logged,
  onLog,
}: {
  index: number
  initial: SetDraft
  logged?: SetDraft
  onLog: (s: SetDraft) => void
}) {
  const [draft, setDraft] = useState<SetDraft>(logged ?? initial)
  const isLogged = !!logged

  return (
    <div className={`set-row ${isLogged ? "logged" : ""}`}>
      <span className="set-num">{index + 1}</span>
      <NumberCell label="weight" value={draft.weight} onChange={v => setDraft({ ...draft, weight: v })} step={2.5} disabled={isLogged} />
      <NumberCell label="reps"   value={draft.reps}   onChange={v => setDraft({ ...draft, reps: v })}   step={1}   disabled={isLogged} />
      <NumberCell label="RIR"    value={draft.rir}    onChange={v => setDraft({ ...draft, rir: v })}    step={1}   disabled={isLogged} />
      {!isLogged && (
        <button className="log-btn" onClick={() => onLog(draft)}>Log</button>
      )}
    </div>
  )
}

function NumberCell({ label, value, onChange, step, disabled }: { label: string; value: number; onChange: (v: number) => void; step: number; disabled?: boolean }) {
  return (
    <label className="cell">
      <span className="cell-label">{label}</span>
      <input
        type="number"
        inputMode="decimal"
        step={step}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value) || 0)}
        disabled={disabled}
      />
    </label>
  )
}
```

- [ ] **Step 2: Create `src/ui/tabs/Today/ExerciseCard.tsx`**

```tsx
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { db, LoggedExercise } from "../../../data/db"
import { logSet } from "../../../data/mutations"
import { lastSessionForExercise } from "../../../data/queries"
import { suggestNext } from "../../../domain/progression"
import { SEEDED_PLAN } from "../../../domain/plan"
import { prescribedSetCount, isDeloadWeek, deloadWeight, deloadRir } from "../../../domain/mesocycle"
import { getActiveMesocycle } from "../../../data/queries"
import SetRow, { SetDraft } from "./SetRow"

export default function ExerciseCard({ workoutId, plannedExerciseId, exercise }: {
  workoutId: string
  plannedExerciseId: string
  exercise: LoggedExercise
}) {
  const qc = useQueryClient()
  const plan = SEEDED_PLAN.find(p => p.id === plannedExerciseId)
    ?? SEEDED_PLAN.find(p => p.id === exercise.swappedFromId)
  if (!plan) return <div>Unknown exercise</div>

  const ctx = useQuery({
    queryKey: ["exercise-context", plannedExerciseId],
    queryFn: async () => {
      const [last, meso] = await Promise.all([
        lastSessionForExercise(plannedExerciseId),
        getActiveMesocycle(),
      ])
      const today = new Date()
      const deload = meso ? isDeloadWeek(meso, today) : false
      const targetSetCount = meso ? prescribedSetCount(plan, meso, today) : plan.baseSetCount
      const baseSuggestion = suggestNext(
        { repRange: plan.repRange, rir: plan.rir, increment: plan.increment, defaultStartingWeight: plan.defaultStartingWeight },
        last,
      )
      const suggestion: SetDraft = deload
        ? { weight: deloadWeight(baseSuggestion.weight), reps: baseSuggestion.reps, rir: deloadRir(baseSuggestion.rir) }
        : baseSuggestion
      return { last, suggestion, targetSetCount, deload }
    },
  })

  const log = useMutation({
    mutationFn: (s: SetDraft) => logSet(workoutId, plannedExerciseId, s),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workout", workoutId] })
    },
  })

  if (ctx.isLoading || !ctx.data) return <div>Loading exercise…</div>

  const { suggestion, targetSetCount, last, deload } = ctx.data
  const totalRows = Math.max(targetSetCount, exercise.sets.length)
  const lastSummary = last
    ? last.sets.map(s => `${s.weight}×${s.reps}`).join(", ")
    : "no prior session — using default"

  return (
    <div className="exercise-body">
      <div className="target-line">
        <strong>{plan.repRange[0]}–{plan.repRange[1]} reps @ {plan.rir} RIR{deload ? " · DELOAD" : ""}</strong>
        <span className="target-history">last: {lastSummary}</span>
      </div>
      <div className="sets">
        {Array.from({ length: totalRows }).map((_, i) => (
          <SetRow
            key={i}
            index={i}
            initial={suggestion}
            logged={exercise.sets[i] ? { weight: exercise.sets[i].weight, reps: exercise.sets[i].reps, rir: exercise.sets[i].rir } : undefined}
            onLog={s => log.mutate(s)}
          />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Wire `ExerciseCard` into `ActiveWorkout.tsx`**

Replace the placeholder body in `ActiveWorkout.tsx` (the line `<div className="card-body">Exercise card body (next task)</div>`) with:

```tsx
<div className="card-body">
  <ExerciseCard workoutId={w.id} plannedExerciseId={ex.plannedExerciseId} exercise={ex} />
</div>
```

Add the import at the top:

```tsx
import ExerciseCard from "./ExerciseCard"
```

- [ ] **Step 4: Add styles**

Append to `src/ui/styles.css`:

```css
.target-line { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 12px; flex-wrap: wrap; gap: 4px; }
.target-history { color: var(--text-dim); font-size: 13px; }

.sets { display: flex; flex-direction: column; gap: 8px; }
.set-row {
  display: grid; grid-template-columns: 24px repeat(3, 1fr) auto;
  align-items: end; gap: 8px;
}
.set-row.logged { opacity: 0.7; }
.set-num { color: var(--text-dim); font-size: 13px; padding-bottom: 12px; }
.cell { display: flex; flex-direction: column; gap: 2px; }
.cell-label { font-size: 11px; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.05em; }
.cell input {
  width: 100%; background: var(--surface); border: 1px solid var(--surface-2); border-radius: 8px;
  color: var(--text); padding: 12px 8px; font-size: 18px; text-align: center;
  min-height: var(--tap);
}
.cell input:disabled { background: var(--bg); color: var(--text-dim); }
.log-btn {
  background: var(--accent); color: #0a1a10; border: 0; border-radius: 8px;
  padding: 0 12px; font-weight: 600; min-height: var(--tap);
}
```

- [ ] **Step 5: Manual verify**

Run dev server. Start a workout, expand an exercise. Expected: target line shows rep range + RIR, set rows prefilled with the suggestion, three big number inputs per row, big "Log" button. Tap "Log" — row dims and Log button disappears.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(ui): add ExerciseCard with prefilled targets and set logging"
```

---

## Task 19: Today tab — Warmup card

**Files:**
- Create: `src/ui/tabs/Today/WarmupCard.tsx`
- Modify: `src/ui/tabs/Today/ActiveWorkout.tsx`
- Modify: `src/ui/styles.css`

- [ ] **Step 1: Create `src/ui/tabs/Today/WarmupCard.tsx`**

```tsx
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { db, LoggedWorkout } from "../../../data/db"
import { getActiveMesocycle, getSettings, lastSessionForExercise } from "../../../data/queries"
import { SEEDED_PLAN } from "../../../domain/plan"
import { suggestNext } from "../../../domain/progression"
import { isDeloadWeek, deloadWeight } from "../../../domain/mesocycle"
import { rampUpSets } from "../../../domain/warmup"

export default function WarmupCard({ workout, onDone }: { workout: LoggedWorkout; onDone: () => void }) {
  const opening = workout.exercises
    .map(e => ({ ex: e, plan: SEEDED_PLAN.find(p => p.id === e.plannedExerciseId) ?? SEEDED_PLAN.find(p => p.id === e.swappedFromId) }))
    .find(x => x.plan?.isOpeningCompound)

  const ctx = useQuery({
    queryKey: ["warmup", workout.id, opening?.plan?.id],
    queryFn: async () => {
      if (!opening?.plan) return null
      const [last, meso, settings] = await Promise.all([
        lastSessionForExercise(opening.ex.plannedExerciseId),
        getActiveMesocycle(),
        getSettings(),
      ])
      const today = new Date()
      const base = suggestNext(
        { repRange: opening.plan.repRange, rir: opening.plan.rir, increment: opening.plan.increment, defaultStartingWeight: opening.plan.defaultStartingWeight },
        last,
      )
      const working = meso && isDeloadWeek(meso, today) ? deloadWeight(base.weight) : base.weight
      return {
        working,
        ramps: rampUpSets(working),
        mobility: settings?.warmupMobilityItems ?? [],
        exerciseName: opening.ex.nameAtTime,
      }
    },
  })

  const [checked, setChecked] = useState<Set<string>>(new Set())
  if (!ctx.data) return <div>Loading warmup…</div>
  const { working, ramps, mobility, exerciseName } = ctx.data
  const toggle = (key: string) => {
    const next = new Set(checked)
    next.has(key) ? next.delete(key) : next.add(key)
    setChecked(next)
  }

  return (
    <div className="warmup">
      <h3 className="warmup-section">General warmup</h3>
      <ul className="warmup-list">
        <li>
          <label className="check-row">
            <input type="checkbox" checked={checked.has("cardio")} onChange={() => toggle("cardio")} />
            <span>5 min light cardio</span>
          </label>
        </li>
        {mobility.map(item => (
          <li key={item}>
            <label className="check-row">
              <input type="checkbox" checked={checked.has(item)} onChange={() => toggle(item)} />
              <span>{item}</span>
            </label>
          </li>
        ))}
      </ul>

      <h3 className="warmup-section">Ramp-up — {exerciseName} (working: {working} lb)</h3>
      <ul className="ramp-list">
        {ramps.map((r, i) => (
          <li key={i} className="ramp-row">
            <span className="ramp-pct">{["50%", "70%", "85%", "95%"][i]}</span>
            <span className="ramp-set">{r.weight} × {r.reps}</span>
          </li>
        ))}
      </ul>

      <button className="primary-btn" onClick={onDone}>Warmup done</button>
    </div>
  )
}
```

- [ ] **Step 2: Wire it into `ActiveWorkout.tsx`**

Replace the warmup placeholder body:

```tsx
{expanded === "warmup" && (
  <div className="card-body">
    <WarmupCard
      workout={w}
      onDone={() => {
        const first = w.exercises[0]
        setExpanded(first ? first.plannedExerciseId : "")
      }}
    />
  </div>
)}
```

Add the import:

```tsx
import WarmupCard from "./WarmupCard"
```

- [ ] **Step 3: Add styles**

Append to `src/ui/styles.css`:

```css
.warmup { display: flex; flex-direction: column; gap: 12px; }
.warmup-section { font-size: 13px; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.05em; margin: 8px 0 4px; font-weight: 600; }
.warmup-list, .ramp-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 4px; }
.check-row { display: flex; align-items: center; gap: 10px; padding: 8px 0; min-height: var(--tap); }
.check-row input[type="checkbox"] { width: 22px; height: 22px; }
.ramp-row { display: flex; justify-content: space-between; padding: 8px 0; }
.ramp-pct { color: var(--text-dim); font-size: 13px; }
.ramp-set { font-size: 16px; font-weight: 500; }
```

- [ ] **Step 4: Manual verify**

Dev server: start workout, the warmup card is expanded by default. See cardio + mobility checklist and four ramp-up sets calculated from suggested working weight. Tap items to check. Tap "Warmup done" → warmup collapses, first exercise expands.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(ui): add warmup card with checklist and ramp-up sets"
```

---

## Task 20: Today tab — Rest timer

**Files:**
- Create: `src/ui/tabs/Today/RestTimer.tsx`
- Create: `src/ui/tabs/Today/restTimerStore.ts`
- Modify: `src/ui/tabs/Today/ActiveWorkout.tsx`
- Modify: `src/ui/tabs/Today/ExerciseCard.tsx`
- Modify: `src/ui/styles.css`

- [ ] **Step 1: Create `src/ui/tabs/Today/restTimerStore.ts`**

```ts
import { useSyncExternalStore } from "react"

type State = { endsAt: number | null }

let state: State = { endsAt: null }
const listeners = new Set<() => void>()

function notify() { listeners.forEach(l => l()) }

export const restTimer = {
  start(seconds: number) {
    state = { endsAt: Date.now() + seconds * 1000 }
    notify()
  },
  add(seconds: number) {
    if (state.endsAt == null) return
    state = { endsAt: state.endsAt + seconds * 1000 }
    notify()
  },
  skip() {
    state = { endsAt: null }
    notify()
  },
  subscribe(fn: () => void) {
    listeners.add(fn)
    return () => listeners.delete(fn)
  },
  getSnapshot(): State {
    return state
  },
}

export function useRestTimer() {
  return useSyncExternalStore(restTimer.subscribe, restTimer.getSnapshot, restTimer.getSnapshot)
}
```

- [ ] **Step 2: Create `src/ui/tabs/Today/RestTimer.tsx`**

```tsx
import { useEffect, useState } from "react"
import { restTimer, useRestTimer } from "./restTimerStore"

export default function RestTimer() {
  const { endsAt } = useRestTimer()
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    if (endsAt == null) return
    const id = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(id)
  }, [endsAt])

  if (endsAt == null) return null

  const remaining = Math.max(0, endsAt - now)
  const seconds = Math.ceil(remaining / 1000)
  const mm = Math.floor(seconds / 60).toString().padStart(2, "0")
  const ss = (seconds % 60).toString().padStart(2, "0")

  return (
    <div className="rest-timer" role="status">
      <span className="rt-time">{mm}:{ss}</span>
      <button className="rt-btn" onClick={() => restTimer.add(30)}>+30s</button>
      <button className="rt-btn" onClick={() => restTimer.skip()}>Skip</button>
    </div>
  )
}
```

- [ ] **Step 3: Render `RestTimer` in `ActiveWorkout.tsx`**

Add at the top of the returned JSX, inside the wrapping `<div>`:

```tsx
<RestTimer />
```

Add the import:

```tsx
import RestTimer from "./RestTimer"
```

- [ ] **Step 4: Trigger the timer on `Log` in `ExerciseCard.tsx`**

In the `log` mutation, change `onSuccess` to:

```tsx
onSuccess: () => {
  qc.invalidateQueries({ queryKey: ["workout", workoutId] })
  restTimer.start(plan.restSeconds)
},
```

Add the import at the top:

```tsx
import { restTimer } from "./restTimerStore"
```

- [ ] **Step 5: Add styles**

Append to `src/ui/styles.css`:

```css
.rest-timer {
  position: sticky; top: 0; z-index: 10;
  background: var(--accent-dim); color: var(--accent);
  display: flex; align-items: center; gap: 12px; padding: 10px 14px;
  border-radius: 999px; margin-bottom: 8px;
}
.rt-time { font-variant-numeric: tabular-nums; font-weight: 600; font-size: 18px; flex: 1; }
.rt-btn { background: transparent; border: 1px solid var(--accent); color: var(--accent); padding: 6px 10px; border-radius: 999px; min-height: 36px; font-size: 13px; }
```

- [ ] **Step 6: Manual verify**

Dev server: log a set → timer bar appears at the top with countdown. Tap "+30s" → time jumps up. Tap "Skip" → bar disappears.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(ui): add rest timer with auto-start on log"
```

---

## Task 21: Today tab — Summary screen on finish

**Files:**
- Create: `src/ui/tabs/Today/Summary.tsx`
- Modify: `src/ui/tabs/Today/index.tsx`
- Modify: `src/ui/tabs/Today/ActiveWorkout.tsx`
- Modify: `src/ui/styles.css`

We'll show a summary screen for ~3 seconds after finishing before falling back to Idle. Simpler than wiring routing: just a state flag in `TodayTab`.

- [ ] **Step 1: Create `src/ui/tabs/Today/Summary.tsx`**

```tsx
import { LoggedWorkout } from "../../../data/db"

const DAY_LABEL: Record<string, string> = {
  UpperA: "Upper A", LowerA: "Lower A", UpperB: "Upper B", LowerB: "Lower B",
}

export default function Summary({ workout, onDismiss }: { workout: LoggedWorkout; onDismiss: () => void }) {
  const totalSets = workout.exercises.reduce((s, e) => s + e.sets.length, 0)
  return (
    <div className="summary">
      <h1>Workout complete</h1>
      <p className="summary-meta">{DAY_LABEL[workout.day]} · {totalSets} sets logged</p>
      <ul className="summary-list">
        {workout.exercises.map(ex => (
          <li key={ex.plannedExerciseId}>
            <strong>{ex.nameAtTime}</strong>
            <span> · {ex.sets.length} sets</span>
          </li>
        ))}
      </ul>
      <button className="primary-btn" onClick={onDismiss}>Done</button>
    </div>
  )
}
```

- [ ] **Step 2: Replace `src/ui/tabs/Today/index.tsx`**

```tsx
import { useState } from "react"
import { useTodayState } from "./useTodayState"
import Idle from "./Idle"
import ActiveWorkout from "./ActiveWorkout"
import Summary from "./Summary"
import { LoggedWorkout } from "../../../data/db"

export default function TodayTab() {
  const q = useTodayState()
  const [justFinished, setJustFinished] = useState<LoggedWorkout | null>(null)

  if (q.isLoading) return <div className="loading">Loading…</div>
  if (q.isError || !q.data) return <div>Error: {String(q.error)}</div>

  if (justFinished) return <Summary workout={justFinished} onDismiss={() => setJustFinished(null)} />
  if (q.data.inProgress) {
    return <ActiveWorkout workout={q.data.inProgress} onFinish={w => setJustFinished(w)} />
  }
  return <Idle state={q.data} />
}
```

- [ ] **Step 3: Update `ActiveWorkout.tsx` to call `onFinish`**

Change the prop type and the finish mutation:

```tsx
export default function ActiveWorkout({ workout, onFinish }: { workout: LoggedWorkout; onFinish: (w: LoggedWorkout) => void }) {
  // ... existing code ...
  const finish = useMutation({
    mutationFn: async () => {
      await finishWorkout(w.id)
      return await db.loggedWorkouts.get(w.id)
    },
    onSuccess: async (finishedWorkout) => {
      qc.invalidateQueries({ queryKey: ["today-state"] })
      qc.invalidateQueries({ queryKey: ["workout", w.id] })
      if (finishedWorkout) onFinish(finishedWorkout)
    },
  })
```

- [ ] **Step 4: Add styles**

Append to `src/ui/styles.css`:

```css
.summary { display: flex; flex-direction: column; gap: 16px; padding-top: 24px; }
.summary h1 { font-size: 28px; margin: 0; }
.summary-meta { color: var(--text-dim); margin: 0; }
.summary-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 6px; }
.summary-list li { background: var(--surface); padding: 12px; border-radius: 10px; }
```

- [ ] **Step 5: Manual verify**

Run a workout end-to-end, log some sets, tap "Finish workout". Expected: summary screen shows day, total sets, per-exercise breakdown. Tap "Done" → back to Idle.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(ui): add post-workout summary screen"
```

---

## Task 22: History tab

**Files:**
- Modify: `src/ui/tabs/History/index.tsx`
- Create: `src/ui/tabs/History/WorkoutList.tsx`
- Create: `src/ui/tabs/History/WorkoutDetail.tsx`
- Create: `src/ui/tabs/History/ExerciseHistory.tsx`
- Modify: `src/ui/styles.css`

- [ ] **Step 1: Replace `src/ui/tabs/History/index.tsx`**

```tsx
import { useState } from "react"
import WorkoutList from "./WorkoutList"
import WorkoutDetail from "./WorkoutDetail"
import ExerciseHistory from "./ExerciseHistory"

type View =
  | { kind: "list" }
  | { kind: "workout"; id: string }
  | { kind: "exercise"; plannedExerciseId: string }

export default function HistoryTab() {
  const [view, setView] = useState<View>({ kind: "list" })
  const [mode, setMode] = useState<"workouts" | "exercises">("workouts")

  return (
    <div className="history">
      {view.kind === "list" && (
        <>
          <div className="seg-control">
            <button className={mode === "workouts" ? "active" : ""} onClick={() => setMode("workouts")}>By session</button>
            <button className={mode === "exercises" ? "active" : ""} onClick={() => setMode("exercises")}>By exercise</button>
          </div>
          <WorkoutList
            mode={mode}
            onOpenWorkout={id => setView({ kind: "workout", id })}
            onOpenExercise={plannedExerciseId => setView({ kind: "exercise", plannedExerciseId })}
          />
        </>
      )}
      {view.kind === "workout" && (
        <WorkoutDetail id={view.id} onBack={() => setView({ kind: "list" })} />
      )}
      {view.kind === "exercise" && (
        <ExerciseHistory plannedExerciseId={view.plannedExerciseId} onBack={() => setView({ kind: "list" })} />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Create `src/ui/tabs/History/WorkoutList.tsx`**

```tsx
import { useQuery } from "@tanstack/react-query"
import { db } from "../../../data/db"
import { SEEDED_PLAN } from "../../../domain/plan"

const DAY_LABEL: Record<string, string> = {
  UpperA: "Upper A", LowerA: "Lower A", UpperB: "Upper B", LowerB: "Lower B",
}

export default function WorkoutList({
  mode,
  onOpenWorkout,
  onOpenExercise,
}: {
  mode: "workouts" | "exercises"
  onOpenWorkout: (id: string) => void
  onOpenExercise: (plannedExerciseId: string) => void
}) {
  const workoutsQ = useQuery({
    queryKey: ["history-workouts"],
    queryFn: async () => {
      const all = await db.loggedWorkouts.filter(w => !!w.finishedAt).toArray()
      return all.sort((a, b) => (b.finishedAt ?? "").localeCompare(a.finishedAt ?? ""))
    },
  })

  if (mode === "workouts") {
    if (!workoutsQ.data) return <div>Loading…</div>
    if (workoutsQ.data.length === 0) return <p className="empty">No completed workouts yet.</p>
    return (
      <ul className="hist-list">
        {workoutsQ.data.map(w => (
          <li key={w.id}>
            <button className="hist-row" onClick={() => onOpenWorkout(w.id)}>
              <strong>{DAY_LABEL[w.day]}</strong>
              <span className="hist-meta">{w.date} · {w.exercises.reduce((s, e) => s + e.sets.length, 0)} sets</span>
            </button>
          </li>
        ))}
      </ul>
    )
  }

  // exercises mode — alphabetical
  const sorted = [...SEEDED_PLAN].sort((a, b) => a.name.localeCompare(b.name))
  return (
    <ul className="hist-list">
      {sorted.map(p => (
        <li key={p.id}>
          <button className="hist-row" onClick={() => onOpenExercise(p.id)}>
            <strong>{p.name}</strong>
            <span className="hist-meta">{DAY_LABEL[p.day]}</span>
          </button>
        </li>
      ))}
    </ul>
  )
}
```

- [ ] **Step 3: Create `src/ui/tabs/History/WorkoutDetail.tsx`**

```tsx
import { useQuery } from "@tanstack/react-query"
import { db } from "../../../data/db"

const DAY_LABEL: Record<string, string> = {
  UpperA: "Upper A", LowerA: "Lower A", UpperB: "Upper B", LowerB: "Lower B",
}

export default function WorkoutDetail({ id, onBack }: { id: string; onBack: () => void }) {
  const q = useQuery({ queryKey: ["workout-detail", id], queryFn: () => db.loggedWorkouts.get(id) })
  if (!q.data) return <div>Loading…</div>
  const w = q.data
  return (
    <div className="workout-detail">
      <button className="link-btn" onClick={onBack}>← Back</button>
      <h1>{DAY_LABEL[w.day]} · {w.date}</h1>
      {w.exercises.map(ex => (
        <section key={ex.plannedExerciseId} className="card">
          <div className="card-header"><span>{ex.nameAtTime}</span></div>
          <div className="card-body">
            {ex.sets.length === 0 ? <em>No sets logged.</em> : (
              <ul className="set-summary">
                {ex.sets.map((s, i) => <li key={i}>{i + 1}. {s.weight} × {s.reps} @ {s.rir} RIR</li>)}
              </ul>
            )}
          </div>
        </section>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Create `src/ui/tabs/History/ExerciseHistory.tsx`**

```tsx
import { useQuery } from "@tanstack/react-query"
import { historyForExercise } from "../../../data/queries"
import { db } from "../../../data/db"
import { SEEDED_PLAN } from "../../../domain/plan"

export default function ExerciseHistory({ plannedExerciseId, onBack }: { plannedExerciseId: string; onBack: () => void }) {
  const plan = SEEDED_PLAN.find(p => p.id === plannedExerciseId)

  const q = useQuery({
    queryKey: ["exercise-history", plannedExerciseId],
    queryFn: async () => {
      const all = await db.loggedWorkouts.filter(w => !!w.finishedAt && w.exercises.some(e => e.plannedExerciseId === plannedExerciseId)).toArray()
      all.sort((a, b) => (b.finishedAt ?? "").localeCompare(a.finishedAt ?? ""))
      return all.map(w => ({
        date: w.date,
        sets: w.exercises.find(e => e.plannedExerciseId === plannedExerciseId)!.sets,
      }))
    },
  })

  if (!q.data) return <div>Loading…</div>

  return (
    <div className="exercise-history">
      <button className="link-btn" onClick={onBack}>← Back</button>
      <h1>{plan?.name ?? plannedExerciseId}</h1>
      {q.data.length === 0 ? <p className="empty">No history yet.</p> : (
        <ul className="hist-list">
          {q.data.map((entry, i) => (
            <li key={i} className="card">
              <div className="card-header"><span>{entry.date}</span></div>
              <div className="card-body">
                <ul className="set-summary">
                  {entry.sets.map((s, j) => <li key={j}>{j + 1}. {s.weight} × {s.reps} @ {s.rir} RIR</li>)}
                </ul>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
```

- [ ] **Step 5: Add styles**

Append to `src/ui/styles.css`:

```css
.history { display: flex; flex-direction: column; gap: 12px; }
.seg-control { display: flex; background: var(--surface); border-radius: 999px; padding: 4px; gap: 4px; }
.seg-control button { flex: 1; background: transparent; color: var(--text-dim); border: 0; padding: 10px; border-radius: 999px; min-height: var(--tap); }
.seg-control button.active { background: var(--surface-2); color: var(--text); }
.hist-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px; }
.hist-row { width: 100%; display: flex; justify-content: space-between; align-items: center; background: var(--surface); border: 0; padding: 14px 16px; border-radius: 10px; text-align: left; color: var(--text); min-height: var(--tap); }
.hist-meta { color: var(--text-dim); font-size: 14px; }
.empty { color: var(--text-dim); padding: 16px 0; }
.workout-detail, .exercise-history { display: flex; flex-direction: column; gap: 12px; }
.set-summary { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 4px; color: var(--text); }
```

- [ ] **Step 6: Manual verify**

Run a couple of workouts. Go to History → "By session" → see them listed → tap one → see per-exercise breakdown. Toggle to "By exercise" → tap one → see sessions for that exercise.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(ui): add history tab with session and exercise views"
```

---

## Task 23: Plan tab — mesocycle controls + settings

**Files:**
- Modify: `src/ui/tabs/Plan/index.tsx`
- Create: `src/ui/tabs/Plan/MesocycleControls.tsx`
- Create: `src/ui/tabs/Plan/PlanList.tsx`
- Create: `src/ui/tabs/Plan/SettingsPanel.tsx`
- Modify: `src/ui/styles.css`

- [ ] **Step 1: Replace `src/ui/tabs/Plan/index.tsx`**

```tsx
import MesocycleControls from "./MesocycleControls"
import PlanList from "./PlanList"
import SettingsPanel from "./SettingsPanel"

export default function PlanTab() {
  return (
    <div className="plan-tab">
      <MesocycleControls />
      <PlanList />
      <SettingsPanel />
    </div>
  )
}
```

- [ ] **Step 2: Create `src/ui/tabs/Plan/MesocycleControls.tsx`**

```tsx
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getActiveMesocycle } from "../../../data/queries"
import { startDeloadNow, resetMesocycle, completeMesocycleAndStartNew } from "../../../data/mutations"
import { currentWeek, isDeloadWeek } from "../../../domain/mesocycle"

export default function MesocycleControls() {
  const qc = useQueryClient()
  const q = useQuery({ queryKey: ["meso"], queryFn: getActiveMesocycle })
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["meso"] })
    qc.invalidateQueries({ queryKey: ["today-state"] })
  }
  const startDeload = useMutation({ mutationFn: startDeloadNow, onSuccess: invalidate })
  const reset = useMutation({ mutationFn: resetMesocycle, onSuccess: invalidate })
  const newMeso = useMutation({ mutationFn: completeMesocycleAndStartNew, onSuccess: invalidate })

  if (!q.data) return null
  const today = new Date()
  const week = currentWeek(q.data, today)
  const deload = isDeloadWeek(q.data, today)

  return (
    <section className="card">
      <div className="card-header"><span>Mesocycle</span></div>
      <div className="card-body">
        <p className="meso-status">
          Week {week} of {q.data.weekLength}{deload ? " · DELOAD" : ""}
        </p>
        <div className="meso-actions">
          <button className="secondary-btn" onClick={() => startDeload.mutate()} disabled={deload}>
            Start deload now
          </button>
          <button className="secondary-btn" onClick={() => reset.mutate()}>Reset mesocycle</button>
          <button className="secondary-btn" onClick={() => newMeso.mutate()} disabled={!deload}>
            Skip deload &amp; start new
          </button>
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 3: Create `src/ui/tabs/Plan/PlanList.tsx`**

```tsx
import { SEEDED_PLAN, WORKOUT_ROTATION, WorkoutDay } from "../../../domain/plan"

const DAY_LABEL: Record<WorkoutDay, string> = {
  UpperA: "Upper A", LowerA: "Lower A", UpperB: "Upper B", LowerB: "Lower B",
}

export default function PlanList() {
  return (
    <section className="plan-list">
      {WORKOUT_ROTATION.map(day => {
        const exercises = SEEDED_PLAN.filter(p => p.day === day).sort((a, b) => a.order - b.order)
        return (
          <details key={day} className="plan-day">
            <summary><strong>{DAY_LABEL[day]}</strong> <span className="hist-meta">{exercises.length} exercises</span></summary>
            <ul className="plan-exercises">
              {exercises.map(ex => (
                <li key={ex.id}>
                  <span>{ex.name}</span>
                  <span className="hist-meta">{ex.repRange[0]}–{ex.repRange[1]} reps @ {ex.rir} RIR</span>
                </li>
              ))}
            </ul>
          </details>
        )
      })}
    </section>
  )
}
```

- [ ] **Step 4: Create `src/ui/tabs/Plan/SettingsPanel.tsx`**

```tsx
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getSettings } from "../../../data/queries"
import { db } from "../../../data/db"

export default function SettingsPanel() {
  const qc = useQueryClient()
  const q = useQuery({ queryKey: ["settings"], queryFn: getSettings })
  const setUnits = useMutation({
    mutationFn: (units: "lb" | "kg") => db.settings.update("singleton", { units }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings"] }),
  })

  const exportData = async () => {
    const [workouts, mesos, plan, settings] = await Promise.all([
      db.loggedWorkouts.toArray(),
      db.mesocycles.toArray(),
      db.plannedExercises.toArray(),
      db.settings.toArray(),
    ])
    const blob = new Blob([JSON.stringify({ workouts, mesos, plan, settings }, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `workouts-export-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const resetAll = async () => {
    if (!confirm("Erase all data and re-seed?")) return
    await db.delete()
    await db.open()
    location.reload()
  }

  if (!q.data) return null

  return (
    <section className="card">
      <div className="card-header"><span>Settings</span></div>
      <div className="card-body settings-body">
        <label className="settings-row">
          <span>Units</span>
          <select value={q.data.units} onChange={e => setUnits.mutate(e.target.value as "lb" | "kg")}>
            <option value="lb">lb</option>
            <option value="kg">kg</option>
          </select>
        </label>
        <button className="secondary-btn" onClick={exportData}>Export data (JSON)</button>
        <button className="secondary-btn danger" onClick={resetAll}>Reset all data</button>
      </div>
    </section>
  )
}
```

- [ ] **Step 5: Add styles**

Append to `src/ui/styles.css`:

```css
.plan-tab { display: flex; flex-direction: column; gap: 12px; }
.meso-status { margin: 0 0 12px; font-weight: 500; }
.meso-actions { display: flex; flex-direction: column; gap: 8px; }
.secondary-btn {
  background: var(--surface-2); color: var(--text); border: 0; padding: 12px;
  border-radius: 8px; min-height: var(--tap); font-weight: 500;
}
.secondary-btn:disabled { opacity: 0.4; }
.secondary-btn.danger { color: var(--danger); }

.plan-list { display: flex; flex-direction: column; gap: 8px; }
.plan-day { background: var(--surface); border-radius: 10px; padding: 12px 16px; }
.plan-day summary { cursor: pointer; display: flex; justify-content: space-between; align-items: center; min-height: var(--tap); }
.plan-exercises { list-style: none; padding: 8px 0 0; margin: 0; display: flex; flex-direction: column; gap: 6px; }
.plan-exercises li { display: flex; justify-content: space-between; padding: 6px 0; }

.settings-body { display: flex; flex-direction: column; gap: 12px; }
.settings-row { display: flex; justify-content: space-between; align-items: center; min-height: var(--tap); }
.settings-row select { background: var(--surface); color: var(--text); border: 1px solid var(--surface-2); border-radius: 8px; padding: 8px 12px; font-size: 16px; }
```

- [ ] **Step 6: Manual verify**

Open Plan tab. Expected:
- Mesocycle section showing "Week N of 5" with three buttons. Try "Start deload now" → status flips to DELOAD on the Today tab too.
- Plan list of all four workouts, expandable.
- Settings: units toggle works, Export downloads a JSON file, Reset wipes data and reseeds.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(ui): add Plan tab with mesocycle controls, plan list, settings"
```

---

## Task 24: Stall banner + edit working weight on warmup

**Files:**
- Modify: `src/ui/tabs/Today/ExerciseCard.tsx`
- Modify: `src/ui/tabs/Today/WarmupCard.tsx`
- Modify: `src/ui/styles.css`

- [ ] **Step 1: Add stall banner to `ExerciseCard.tsx`**

In the `useQuery` for `exercise-context`, also fetch history and compute stalls. Replace the `queryFn` with:

```tsx
queryFn: async () => {
  const { historyForExercise } = await import("../../../data/queries")
  const { countStall } = await import("../../../domain/progression")
  const [last, meso, history] = await Promise.all([
    lastSessionForExercise(plannedExerciseId),
    getActiveMesocycle(),
    historyForExercise(plannedExerciseId),
  ])
  const today = new Date()
  const deload = meso ? isDeloadWeek(meso, today) : false
  const targetSetCount = meso ? prescribedSetCount(plan, meso, today) : plan.baseSetCount
  const baseSuggestion = suggestNext(
    { repRange: plan.repRange, rir: plan.rir, increment: plan.increment, defaultStartingWeight: plan.defaultStartingWeight },
    last,
  )
  const suggestion: SetDraft = deload
    ? { weight: deloadWeight(baseSuggestion.weight), reps: baseSuggestion.reps, rir: deloadRir(baseSuggestion.rir) }
    : baseSuggestion
  const stallCount = countStall(history)
  return { last, suggestion, targetSetCount, deload, stallCount }
},
```

In the rendered JSX, above `target-line`, add:

```tsx
{ctx.data.stallCount >= 3 && (
  <div className="banner banner-warn">
    Stalled {ctx.data.stallCount} sessions — consider a swap or extra set.
  </div>
)}
```

- [ ] **Step 2: Allow editing working weight on the warmup card**

In `WarmupCard.tsx`, change the `working` state to live local state initialized from the query value, and recompute ramps from it:

Replace the body of the component (the `if (!ctx.data) return ...` and below) with:

```tsx
const [workingOverride, setWorkingOverride] = useState<number | null>(null)
const [checked, setChecked] = useState<Set<string>>(new Set())
if (!ctx.data) return <div>Loading warmup…</div>
const { working: suggested, mobility, exerciseName } = ctx.data
const working = workingOverride ?? suggested
const ramps = rampUpSets(working)

const toggle = (key: string) => {
  const next = new Set(checked)
  next.has(key) ? next.delete(key) : next.add(key)
  setChecked(next)
}

return (
  <div className="warmup">
    <h3 className="warmup-section">General warmup</h3>
    <ul className="warmup-list">
      <li>
        <label className="check-row">
          <input type="checkbox" checked={checked.has("cardio")} onChange={() => toggle("cardio")} />
          <span>5 min light cardio</span>
        </label>
      </li>
      {mobility.map(item => (
        <li key={item}>
          <label className="check-row">
            <input type="checkbox" checked={checked.has(item)} onChange={() => toggle(item)} />
            <span>{item}</span>
          </label>
        </li>
      ))}
    </ul>

    <h3 className="warmup-section">Ramp-up — {exerciseName}</h3>
    <label className="working-weight">
      Working weight (lb):
      <input
        type="number"
        inputMode="decimal"
        step={2.5}
        value={working}
        onChange={e => setWorkingOverride(parseFloat(e.target.value) || 0)}
      />
    </label>
    <ul className="ramp-list">
      {ramps.map((r, i) => (
        <li key={i} className="ramp-row">
          <span className="ramp-pct">{["50%", "70%", "85%", "95%"][i]}</span>
          <span className="ramp-set">{r.weight} × {r.reps}</span>
        </li>
      ))}
    </ul>

    <button className="primary-btn" onClick={onDone}>Warmup done</button>
  </div>
)
```

Note: the existing `useQuery` already returns `ramps`; we now ignore that and recompute. To avoid confusion, drop `ramps` from the query's returned object (only return `working`, `mobility`, `exerciseName`):

```tsx
return {
  working,
  mobility: settings?.warmupMobilityItems ?? [],
  exerciseName: opening.ex.nameAtTime,
}
```

Make sure the `rampUpSets` import is still at the top of `WarmupCard.tsx`.

- [ ] **Step 3: Add styles**

Append to `src/ui/styles.css`:

```css
.banner { padding: 10px 12px; border-radius: 8px; margin-bottom: 10px; font-size: 14px; }
.banner-warn { background: rgba(217, 102, 102, 0.15); color: var(--danger); }
.working-weight { display: flex; align-items: center; gap: 8px; font-size: 14px; color: var(--text-dim); }
.working-weight input { width: 80px; background: var(--surface); border: 1px solid var(--surface-2); border-radius: 8px; color: var(--text); padding: 8px; font-size: 16px; text-align: center; }
```

- [ ] **Step 4: Manual verify**

Edit working weight on warmup card — ramps update live. After 3 sessions with no progression, the exercise card shows the stall banner.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(ui): add stall banner and editable warmup working weight"
```

---

## Task 25: Exercise swap UI

**Files:**
- Modify: `src/ui/tabs/Today/ExerciseCard.tsx`
- Modify: `src/ui/styles.css`

- [ ] **Step 1: Add a "swap" button + sheet to `ExerciseCard.tsx`**

At the top of the returned JSX of `ExerciseCard`, above `target-line`, add a small toolbar with a swap button:

```tsx
<div className="ex-toolbar">
  <button className="link-btn" onClick={() => setSwapOpen(true)}>Swap</button>
</div>
{swapOpen && (
  <SwapSheet
    currentPlannedExerciseId={plannedExerciseId}
    category={plan.category}
    onClose={() => setSwapOpen(false)}
    onSwap={async (target) => {
      const { swapExercise } = await import("../../../data/mutations")
      await swapExercise(workoutId, plannedExerciseId, { newPlannedExerciseId: target.id, newName: target.name })
      setSwapOpen(false)
      qc.invalidateQueries({ queryKey: ["workout", workoutId] })
    }}
  />
)}
```

Add the import + state at the top of the component:

```tsx
import { useState } from "react"
```

```tsx
const [swapOpen, setSwapOpen] = useState(false)
```

- [ ] **Step 2: Define `SwapSheet` at the bottom of `ExerciseCard.tsx`**

```tsx
function SwapSheet({
  currentPlannedExerciseId,
  category,
  onClose,
  onSwap,
}: {
  currentPlannedExerciseId: string
  category: string
  onClose: () => void
  onSwap: (target: { id: string; name: string }) => void
}) {
  const candidates = SEEDED_PLAN
    .filter(p => p.category === category && p.id !== currentPlannedExerciseId)
  return (
    <div className="sheet" role="dialog">
      <div className="sheet-card">
        <h3>Swap to</h3>
        <ul className="hist-list">
          {candidates.length === 0 && <li className="empty">No swap options in category “{category}”.</li>}
          {candidates.map(c => (
            <li key={c.id}>
              <button className="hist-row" onClick={() => onSwap({ id: c.id, name: c.name })}>
                <strong>{c.name}</strong>
                <span className="hist-meta">{c.repRange[0]}–{c.repRange[1]} reps</span>
              </button>
            </li>
          ))}
        </ul>
        <button className="secondary-btn" onClick={onClose}>Cancel</button>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Add styles**

Append to `src/ui/styles.css`:

```css
.ex-toolbar { display: flex; justify-content: flex-end; margin-bottom: 6px; }
.sheet { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: flex-end; z-index: 100; }
.sheet-card { width: 100%; max-height: 80vh; overflow-y: auto; background: var(--surface); border-radius: 16px 16px 0 0; padding: 20px; display: flex; flex-direction: column; gap: 12px; padding-bottom: calc(20px + env(safe-area-inset-bottom)); }
.sheet-card h3 { margin: 0; font-size: 18px; }
```

- [ ] **Step 4: Manual verify**

In an active workout, tap "Swap" on an exercise card. Sheet appears with same-category alternatives. Tap one — exercise name updates, sets reset.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(ui): add exercise swap sheet with same-category candidates"
```

---

## Task 26: Deload elapsed prompt

**Files:**
- Modify: `src/ui/tabs/Today/index.tsx`
- Modify: `src/ui/tabs/Today/Idle.tsx`

- [ ] **Step 1: Add a prompt to `Idle.tsx`**

Above the heading, add:

```tsx
{state.deloadElapsed && (
  <DeloadCompletePrompt />
)}
```

Define `DeloadCompletePrompt` at the bottom of `Idle.tsx`:

```tsx
import { completeMesocycleAndStartNew } from "../../../data/mutations"

function DeloadCompletePrompt() {
  const qc = useQueryClient()
  const newMeso = useMutation({
    mutationFn: completeMesocycleAndStartNew,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["today-state"] }),
  })
  return (
    <div className="banner banner-info">
      Deload complete — start new mesocycle?{" "}
      <button className="link-btn" onClick={() => newMeso.mutate()}>Yes</button>
    </div>
  )
}
```

- [ ] **Step 2: Add `banner-info` style**

Append to `src/ui/styles.css`:

```css
.banner-info { background: rgba(95, 184, 120, 0.15); color: var(--accent); }
```

- [ ] **Step 3: Manual verify**

In Plan tab, tap "Start deload now". Then in your terminal, simulate a week passing — for testing, easiest is to manually edit the active mesocycle's `startedAt` in the browser devtools (Application → IndexedDB → workouts → mesocycles) to a date `weekLength + 1` weeks ago. Reload the app. Expected: Today tab shows the deload-complete banner. Tap "Yes" → new mesocycle, week 1.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(ui): prompt to start new mesocycle after deload elapses"
```

---

## Task 27: First-run setup screen

The seed defaults (`lb`, start with Upper A) make the app functional without this — so feel free to skip until the rest is working — but the spec calls for a 2-question first-run flow.

**Files:**
- Modify: `src/data/db.ts` (add `firstRunDone` field)
- Create: `src/ui/FirstRun.tsx`
- Modify: `src/app.tsx`
- Modify: `src/ui/styles.css`

- [ ] **Step 1: Add `firstRunDone` to Settings**

In `src/data/db.ts`, modify the `Settings` type and the seed function:

```ts
export type Settings = {
  id: "singleton"
  units: "lb" | "kg"
  warmupMobilityItems: string[]
  defaultRestCompound: number
  defaultRestIsolation: number
  rotationPointer: number
  firstRunDone: boolean
}
```

In `seedIfEmpty`, add `firstRunDone: false` to the inserted Settings row.

- [ ] **Step 2: Create `src/ui/FirstRun.tsx`**

```tsx
import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { db } from "../data/db"
import { WORKOUT_ROTATION, WorkoutDay } from "../domain/plan"

const DAY_LABEL: Record<WorkoutDay, string> = {
  UpperA: "Upper A", LowerA: "Lower A", UpperB: "Upper B", LowerB: "Lower B",
}

export default function FirstRun() {
  const qc = useQueryClient()
  const [units, setUnits] = useState<"lb" | "kg">("lb")
  const [day, setDay] = useState<WorkoutDay>("UpperA")

  const finish = useMutation({
    mutationFn: async () => {
      await db.settings.update("singleton", {
        units,
        rotationPointer: WORKOUT_ROTATION.indexOf(day),
        firstRunDone: true,
      })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings"] }),
  })

  return (
    <div className="first-run">
      <h1>Welcome</h1>
      <p className="first-run-meta">Two quick questions, then you’re set.</p>

      <fieldset className="fr-group">
        <legend>Weight units</legend>
        <div className="fr-choices">
          {(["lb", "kg"] as const).map(u => (
            <button key={u} className={`fr-choice ${units === u ? "active" : ""}`} onClick={() => setUnits(u)}>
              {u}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="fr-group">
        <legend>Starting workout</legend>
        <div className="fr-choices fr-grid">
          {WORKOUT_ROTATION.map(d => (
            <button key={d} className={`fr-choice ${day === d ? "active" : ""}`} onClick={() => setDay(d)}>
              {DAY_LABEL[d]}
            </button>
          ))}
        </div>
      </fieldset>

      <button className="primary-btn" onClick={() => finish.mutate()} disabled={finish.isPending}>
        Get started
      </button>
    </div>
  )
}
```

- [ ] **Step 3: Gate the app on first-run**

Replace `src/app.tsx`:

```tsx
import { useEffect, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { seedIfEmpty } from "./data/db"
import { getSettings } from "./data/queries"
import AppShell from "./ui/AppShell"
import FirstRun from "./ui/FirstRun"

export default function App() {
  const [seeded, setSeeded] = useState(false)
  useEffect(() => { seedIfEmpty().then(() => setSeeded(true)) }, [])

  const settingsQ = useQuery({ queryKey: ["settings"], queryFn: getSettings, enabled: seeded })

  if (!seeded || !settingsQ.data) return <div className="loading">Loading…</div>
  if (!settingsQ.data.firstRunDone) return <FirstRun />
  return <AppShell />
}
```

- [ ] **Step 4: Styles**

Append to `src/ui/styles.css`:

```css
.first-run { display: flex; flex-direction: column; gap: 20px; padding: 16px; max-width: 480px; margin: 0 auto; }
.first-run h1 { font-size: 28px; margin: 0; }
.first-run-meta { color: var(--text-dim); margin: 0; }
.fr-group { border: 0; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 10px; }
.fr-group legend { font-size: 13px; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.05em; padding: 0; margin-bottom: 4px; }
.fr-choices { display: flex; gap: 8px; }
.fr-choices.fr-grid { display: grid; grid-template-columns: 1fr 1fr; }
.fr-choice {
  flex: 1; background: var(--surface); color: var(--text); border: 1px solid var(--surface-2);
  padding: 14px; border-radius: 10px; font-size: 16px; min-height: var(--tap);
}
.fr-choice.active { background: var(--accent-dim); color: var(--accent); border-color: var(--accent); }
```

- [ ] **Step 5: Manual verify**

In dev server, clear IndexedDB (DevTools → Application → IndexedDB → workouts → Delete). Reload. Expected: First-run screen with units + starting workout choices. Make a selection. Tap "Get started" → main app appears with chosen settings. Reload — no first-run screen (already done).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(ui): add first-run setup for units and starting workout"
```

---

## Task 28: PWA manifest + icons + service worker

**Files:**
- Modify: `vite.config.ts`
- Modify: `index.html`
- Create: `public/icon-192.png`, `public/icon-512.png`, `public/icon-maskable.png` (placeholder solid-color PNGs)

- [ ] **Step 1: Create placeholder icons**

Until you have a real icon, generate solid-color placeholders. From the repo root:

```bash
mkdir -p public
# Use ImageMagick if available; otherwise download any solid green 192/512 PNG and rename.
# If ImageMagick installed:
convert -size 192x192 xc:'#5fb878' public/icon-192.png 2>/dev/null || true
convert -size 512x512 xc:'#5fb878' public/icon-512.png 2>/dev/null || true
convert -size 512x512 xc:'#5fb878' public/icon-maskable.png 2>/dev/null || true
```

If ImageMagick isn't installed, create the three files manually — any solid green PNG at the right sizes works for now. The PWA install will work; the icon can be replaced later.

- [ ] **Step 2: Update `vite.config.ts`**

```ts
import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"
import { VitePWA } from "vite-plugin-pwa"

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "prompt",
      includeAssets: ["icon-192.png", "icon-512.png", "icon-maskable.png"],
      manifest: {
        name: "Workouts",
        short_name: "Workouts",
        description: "Personal workout tracker",
        theme_color: "#0e0e10",
        background_color: "#0e0e10",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icon-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
    }),
  ],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    globals: true,
  },
})
```

- [ ] **Step 3: Add iOS-specific tags to `index.html`**

Inside `<head>`, ensure the following are present (in addition to those from Task 15 step 7):

```html
<link rel="apple-touch-icon" href="/icon-192.png" />
<link rel="manifest" href="/manifest.webmanifest" />
```

- [ ] **Step 4: Add update-available banner**

Create `src/ui/UpdateBanner.tsx`:

```tsx
import { useEffect, useState } from "react"
import { useRegisterSW } from "virtual:pwa-register/react"

export default function UpdateBanner() {
  const { needRefresh: [needRefresh], updateServiceWorker } = useRegisterSW()
  if (!needRefresh) return null
  return (
    <div className="banner banner-info update-banner">
      Update available
      <button className="link-btn" onClick={() => updateServiceWorker(true)}>Reload</button>
    </div>
  )
}
```

Note: `virtual:pwa-register/react` is provided by `vite-plugin-pwa`. If TypeScript complains, add `/// <reference types="vite-plugin-pwa/react" />` to `src/main.tsx` or to a `src/pwa.d.ts`.

Wire it in `AppShell.tsx` at the top of the JSX:

```tsx
import UpdateBanner from "./UpdateBanner"
// ...
<main className="tab-content">
  <UpdateBanner />
  {/* existing tab routing */}
</main>
```

- [ ] **Step 5: Build and serve**

```bash
npm run build
npm install --save-dev serve
npx serve -s dist
```

Open the served URL on iPhone Safari (via local network) or in desktop Chrome DevTools "Application → Manifest" panel. Expected: manifest loads with the green icon, service worker registers.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(pwa): add manifest, service worker, update banner, iOS meta tags"
```

---

## Task 29: Smoke test for the workout flow

**Files:**
- Create: `src/ui/__tests__/workout-flow.test.tsx`

- [ ] **Step 1: Write the test**

```tsx
import { describe, expect, it, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import App from "../../app"
import { db } from "../../data/db"

beforeEach(async () => {
  await db.delete()
  await db.open()
})

function renderApp() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <App />
    </QueryClientProvider>
  )
}

describe("workout flow", () => {
  it("starts a workout, logs a set, and finishes", async () => {
    renderApp()

    await screen.findByRole("button", { name: /start workout/i })
    fireEvent.click(screen.getByRole("button", { name: /start workout/i }))

    // The workout view appears with a Warmup card and exercise cards
    await screen.findByText(/warmup/i)

    // Expand the first exercise (its name comes from the seeded plan — Smith Machine Bench Press)
    fireEvent.click(screen.getByText(/smith machine bench press/i))

    // Log the first set (use the first visible "Log" button)
    const logButtons = await screen.findAllByRole("button", { name: /^log$/i })
    fireEvent.click(logButtons[0])

    // The Log button for that set should disappear
    await waitFor(() => {
      const remaining = screen.queryAllByRole("button", { name: /^log$/i })
      expect(remaining.length).toBeLessThan(logButtons.length)
    })

    // Finish the workout
    fireEvent.click(screen.getByRole("button", { name: /finish workout/i }))

    // Summary screen
    await screen.findByText(/workout complete/i)
  })
})
```

- [ ] **Step 2: Run the test**

```bash
npm test
```

Expected: pass. If timing-related flake on the warmup card import or query loading, increase `waitFor` timeout (default 1000ms) by passing `{ timeout: 3000 }` to the relevant `findBy*` / `waitFor` calls.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "test: add workout-flow smoke test"
```

---

## Task 30: README + deployment

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Write `README.md`**

```markdown
# Workouts — personal tracker

A phone-first PWA that guides you through a 4-day Upper/Lower lean-bulk mesocycle. Adapted for Planet Fitness equipment. No accounts, no cloud, no sync — data lives on your phone.

## Run locally

```bash
npm install
npm run dev      # dev server at http://localhost:5173
npm test         # vitest
npm run build    # production build to dist/
```

## Install on iPhone

1. Deploy (see below) or run locally and visit the URL from your phone (same network).
2. Open in **Safari**.
3. Tap the Share button → **Add to Home Screen** → done. The app opens full-screen, works offline.

## Deploy to Cloudflare Pages

1. Push the repo to GitHub.
2. In Cloudflare Pages, create a project linked to the repo.
3. Build command: `npm run build`. Output directory: `dist`.
4. Cloudflare auto-deploys on push to `main`.

## Architecture overview

- React 18 + TypeScript + Vite
- Dexie (IndexedDB) for all data
- React Query for read/write coordination
- vite-plugin-pwa for service worker + manifest
- Pure-function domain layer (`src/domain/`) covers progression, mesocycle math, warmup ramp-ups — unit-tested

See `docs/superpowers/specs/2026-05-14-workout-tracker-design.md` for the full design.

## Data

All data is in your browser's IndexedDB under origin `workouts`. To back up: **Plan tab → Settings → Export data**. To reset: **Plan tab → Settings → Reset all data**.
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "docs: add README"
```

---

## Plan self-review (engineer should read before starting)

- The plan implements every section of the spec: app shell, idle view, warmup, exercise card with prefill, rest timer, summary, history, plan tab with mesocycle controls, swap, deload prompt, PWA, smoke test, deployment.
- The domain layer is built first and tested heavily; the data layer next, also tested; the UI on top.
- TDD pattern in domain/data tasks; manual verification + one smoke test for UI.
- Increments through the rotation: Upper A → Lower A → Upper B → Lower B → wrap.
- Each task commits independently; no task leaves the repo in a broken state.

If something turns out to be wrong, fix forward rather than reverting. Open a PR or just push to `main` — this is a single-user app with no review pressure.
