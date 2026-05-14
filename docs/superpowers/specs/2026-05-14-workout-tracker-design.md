# Workout Tracker Design

## Purpose

A phone-first workout tracker for the Intermediate Lifter's 4-Day Lean Bulk Blueprint. Guides the user through each session: shows today's workout with previous performance, prefilled targets driven by double progression, a per-session warmup with auto-calculated ramp-up sets, a rest timer, and mesocycle awareness (week-by-week volume progression + deload prompts).

Single-user, single-device. No backend, no accounts, no sync. Installable iPhone PWA, fully offline.

## Source plan summary

Upper/Lower split performed twice weekly: Upper A, Lower A, Upper B, Lower B. Five-to-six week mesocycles with accumulating volume, followed by one deload week. Each session opens with light cardio + dynamic mobility + ramp-up sets on the opening compound. Target RIR 2 on compounds, 0–1 on isolation. Double progression: hit top of rep range, add weight (2.5 lb isolation, 5 lb compound), reset to bottom of range.

The user trains at Planet Fitness, so the seeded plan is pre-adapted: Smith Machine / hack squat / leg press for free-weight squat; Smith bench or machine chest press for barbell bench; assisted pull-up machine for weighted pull-ups; DB or Smith RDL for deadlift variations; etc.

## Scope

In scope:

- Guided workout flow with prefilled targets from history and double progression
- Pre-seeded PF-adapted plan; per-exercise swap with history preserved per stable id
- Mesocycle tracking: current week, linear volume ramp from base to peak set count, deload week, new mesocycle start
- Rest timer with per-exercise rest override
- Warmup card with general warmup checklist + auto-calculated ramp-up sets
- Per-exercise and per-session history view
- Manual mesocycle controls (deload now, skip deload, reset)
- Data export (JSON) from settings
- iPhone PWA, installable, offline

Out of scope:

- Cloud sync, accounts, sharing
- Nutrition tracking (separate app)
- Bodyweight or measurement tracking
- Workout calendar scheduling beyond the rotation pointer
- Cardio sessions, mobility-only sessions
- Social / coaching / AI suggestions beyond the encoded rules
- Multi-program support (the app ships seeded with this one plan)

## Tech stack

- React 18 + TypeScript + Vite
- `vite-plugin-pwa` for service worker, manifest, update prompts
- Dexie (IndexedDB wrapper) for local storage
- `@tanstack/react-query` for query/mutation against Dexie with optimistic updates
- CSS Modules or vanilla CSS (no Tailwind needed; this is small)
- Vitest + React Testing Library
- Cloudflare Pages for deployment (auto-deploy on push)

## Information architecture

Three bottom tabs: **Today**, **History**, **Plan**.

### Today

Default landing. Two states:

**Idle (no workout in progress):**
- Header: `Upper A · Week 2 of 5` (or `Deload week — Upper A`)
- Primary action: `Start workout`
- Below: last 2–3 sessions as summary cards

**Active workout:**
- Vertical scrollable list. First card is the **warmup**; remaining cards are exercises in order.
- Current card expanded; others collapsed showing name + `✓ 3/4 sets` or `—`.
- Expanded exercise card shows:
  - Target line: `8–10 reps @ 2 RIR · last time: 135×9, 135×8, 130×8`
  - One row per set: `weight | reps | RIR` plus a `Log set` button.
- On `Log set`: row turns green, rest timer slides in as a thin bar at the top of the viewport (countdown + `skip` + `+30 s`).
- After last set of last exercise: `Finish workout` button → brief summary screen → back to idle Today.

**Warmup card details:**
- General warmup checklist:
  - [ ] 5 min light cardio
  - [ ] Dynamic mobility (editable list, default: arm circles, leg swings, hip openers, thoracic rotations, scap pull-aparts)
- Ramp-up sets, auto-calculated from today's opening compound working weight: 50% × 8, 70% × 5, 85% × 3, 95% × 1. Rounded to nearest 2.5 lb.
- On first-ever session, ramp-ups compute off the seeded default starting weight. User can edit the working weight before logging; ramp-ups recompute live.
- Tap `Warmup done` → scrolls to first working exercise.

**Note on rest days:** because the rotation is sequence-locked, the app never shows a "rest day" screen. The Today tab always displays the next workout in the rotation. The user chooses whether to do it that day. (Calendar-day rest cues — "the plan suggests resting today" — are out of scope.)

**First-run setup:** On first launch only, ask two questions, then drop into Today:

1. Units (lb / kg) — persisted to `Settings.units`.
2. Which workout do you want to start with — Upper A, Lower A, Upper B, or Lower B? Persisted as `Settings.rotationPointer` (index into the rotation array).

First-run also seeds the database: the four workouts' `PlannedExercise` rows (the PF-adapted defaults), a single `Mesocycle` row with `startedAt = today`, `weekLength = 5`, `status = "active"`, and a `Settings` row.

### History

- Default view: chronological list of completed workouts, newest first.
- Tap a workout → expanded view of that session's logged sets.
- Toggle to "By exercise" view → tap exercise → list of past sessions for that exercise with weight × reps per set; small line chart of top-set weight over time if budget allows.

### Plan

- The four workouts displayed with their exercise lists in order.
- Tap any exercise → detail sheet:
  - Swap to another exercise within the same `category` (curated suggestion list)
  - Override rest seconds
  - Override increment (default 2.5 lb isolation / 5 lb compound)
  - Notes
- Top of tab: mesocycle controls
  - Current week indicator
  - `Start deload now` (skips ahead to deload regardless of current week)
  - `Skip deload` (advances past deload without performing it; available only when status = deload)
  - `Reset mesocycle` (back to week 1, keeps all logged history)
- Bottom of tab: settings
  - Units (lb / kg)
  - Edit dynamic mobility list
  - Data export (downloads JSON of all logged workouts + settings)
  - Reset all data (with confirmation)

## Data model

Five entities in IndexedDB via Dexie.

```ts
type WorkoutDay = "UpperA" | "LowerA" | "UpperB" | "LowerB"

type PlannedExercise = {
  id: string                    // stable, survives renames and swaps
  day: WorkoutDay
  order: number                 // position within the workout
  name: string                  // e.g. "Smith Machine Bench"
  category: string              // e.g. "horizontal-press" — drives swap suggestions
  baseSetCount: number          // sets in week 1 of a mesocycle
  peakSetCount: number          // sets in the final week before deload
  repRange: [number, number]    // e.g. [6, 8]
  rir: number                   // target RIR (e.g. 2)
  restSeconds: number           // per-exercise; defaults inherited from Settings
  increment: number             // weight bump on progression (default 2.5 or 5)
  isOpeningCompound: boolean    // drives warmup ramp-up calculation
  defaultStartingWeight: number // used when no prior history exists
  notes?: string
}

type Mesocycle = {
  id: string
  startedAt: ISODate
  weekLength: number            // 5 or 6
  status: "active" | "completed"
}
// "Are we in a deload week?" is derived from (today - startedAt), not stored.
// Lifecycle ("active" → "completed") is the only persistent state.

type LoggedWorkout = {
  id: string
  day: WorkoutDay
  date: ISODate
  mesocycleId: string
  week: number                  // snapshot, copied from mesocycle at log time
  isDeload: boolean             // snapshot
  exercises: LoggedExercise[]
  finishedAt?: ISODate          // unset while workout in progress
}

type LoggedExercise = {
  plannedExerciseId: string     // ties to PlannedExercise
  nameAtTime: string            // snapshot, in case the plan exercise is later renamed
  sets: LoggedSet[]
  swappedFromId?: string        // if this slot held a different exercise originally
}

type LoggedSet = {
  weight: number
  reps: number
  rir: number
  loggedAt: ISODate
}

type Settings = {
  units: "lb" | "kg"
  warmupMobilityItems: string[]
  defaultRestCompound: number   // seconds, default 150
  defaultRestIsolation: number  // seconds, default 75
  rotationPointer: number       // 0..3 index into [UpperA, LowerA, UpperB, LowerB]
}
```

**Design notes:**

- History is queried, never denormalized. "Last session for exercise X" is a Dexie query against `LoggedWorkout` by `plannedExerciseId`, returning the most recent. Eliminates the bug class where a separate "history" cache drifts from the source of truth.
- Swaps don't lose history. Every `PlannedExercise` has a stable id; swapping in/out preserves both exercises' histories under their own ids.
- Snapshot fields on `LoggedWorkout` (`week`, `isDeload`, `nameAtTime`) decouple historical entries from the mutable plan. Editing or resetting the plan does not rewrite the meaning of past workouts.
- Today's prescribed set count is derived, not stored: `interpolate(baseSetCount, peakSetCount, (currentWeek - 1) / (weekLength - 1))`, rounded to integer.

## Progression logic

Pure functions in `src/domain/`, no React or Dexie imports, fully unit-testable.

### Double progression (`progression.ts`)

For exercise with `[low, high]` rep range, target `rir`, and last session's sets:

```
suggestNext(exercise, lastSession):
  if no lastSession:
    return { weight: exercise.defaultStartingWeight, reps: low, rir: rir }
  topReps = min(set.reps for set in lastSession.sets)  // worst set decides
  if all sets in lastSession achieved >= high reps at the target RIR:
    return { weight: lastSession.weight + exercise.increment, reps: low, rir: rir }
  if topReps < low:
    return { weight: lastSession.weight, reps: low, rir: rir }
  return { weight: lastSession.weight, reps: topReps + 1, rir: rir }
```

"Last session's weight" is the most common weight across sets (tie-broken by max weight) — handles cases where a user dropped weight on a back-off set.

### Stall detection

A stall = consecutive sessions where neither weight nor reps increased. Counted by walking back through `LoggedWorkout`s filtered by `plannedExerciseId`. When count ≥ 3, the exercise card surfaces a banner. Informational only; never blocks logging.

### Mesocycle math (`mesocycle.ts`)

```
currentWeek(mesocycle, today):
  weeks = floor((today - mesocycle.startedAt) / 7 days) + 1
  return max(weeks, 1)
  // Range: 1..weekLength = active training weeks
  //        weekLength + 1 = deload week
  //        > weekLength + 1 = deload elapsed (triggers "start new mesocycle" prompt)

isDeloadWeek(mesocycle, today):
  return currentWeek(mesocycle, today) > mesocycle.weekLength

prescribedSetCount(exercise, mesocycle, today):
  if isDeloadWeek(mesocycle, today):
    return max(1, ceil(exercise.baseSetCount * 0.5))
  week = currentWeek(mesocycle, today)
  t = clamp((week - 1) / (mesocycle.weekLength - 1), 0, 1)
  return round(exercise.baseSetCount + t * (exercise.peakSetCount - exercise.baseSetCount))
```

### Deload behavior

When `isDeloadWeek(mesocycle, today)` returns true:
- Set count: `ceil(baseSetCount * 0.5)`, minimum 1
- Suggested weight: 60% of last working weight (rounded to nearest 2.5 lb)
- Target RIR: `exercise.rir + 1` (one easier)
- Rep ranges unchanged

Once the deload week has elapsed (i.e., the derived week would be `weekLength + 2` or more), the next time the user opens the app it prompts: *Deload complete — start new mesocycle? Working weights carry over.* On confirm: current mesocycle's `status` flips to `completed`, a new `Mesocycle` row is created with `startedAt = today` and `status = "active"`. Working weights persist via `LoggedWorkout` history.

### Manual mesocycle overrides

- `Start deload now`: shifts the current mesocycle's `startedAt` backward so the derived week equals `weekLength + 1` (i.e., deload week starts today).
- `Skip deload`: only available when `isDeloadWeek` is true. Marks the current mesocycle `completed` without requiring deload sessions to be logged, then prompts the user to start a new mesocycle.
- `Reset mesocycle`: marks current `completed`, creates a new one with `startedAt = today`, `status = "active"`. Plan template untouched, history untouched.

### Two-clock scheduling

- **Rotation pointer** (in `Settings`) advances by 1 each time a workout is finished, modulo 4. This determines "today's workout". It is sequence-locked, not calendar-locked: miss a day, the pointer doesn't move; pick up where you left off.
- **Mesocycle week** advances by calendar time from `startedAt`. Missing workouts does not pause the clock; volume falls behind if you miss too much, which is intentional pressure to either catch up or reset.

## Warmup calculation (`warmup.ts`)

```
rampUpSets(workingWeight):
  return [
    { weight: roundTo(workingWeight * 0.50, 2.5), reps: 8 },
    { weight: roundTo(workingWeight * 0.70, 2.5), reps: 5 },
    { weight: roundTo(workingWeight * 0.85, 2.5), reps: 3 },
    { weight: roundTo(workingWeight * 0.95, 2.5), reps: 1 },
  ]
```

Source of `workingWeight`: today's prefilled weight for the first set of the opening compound (i.e., the output of `suggestNext` applied to the opening compound). Recomputes live if the user edits the working weight before logging.

## Code organization

```
src/
  domain/                    pure logic, no React, no Dexie
    plan.ts                  the seeded PF-adapted plan
    progression.ts           suggestNext, stall detection
    mesocycle.ts             week math, deload trigger, set-count interpolation
    warmup.ts                ramp-up calculation
    units.ts                 lb/kg conversions, rounding helpers
  data/
    db.ts                    Dexie schema, version migrations
    queries.ts               last-session lookup, rotation pointer, history queries
    mutations.ts             startWorkout, logSet, finishWorkout, swapExercise, etc.
  ui/
    tabs/Today/
      index.tsx              tab routing between idle / active / rest day
      Idle.tsx               session summary cards + Start button
      ActiveWorkout.tsx      vertical card list
      WarmupCard.tsx
      ExerciseCard.tsx       expanded/collapsed states
      SetRow.tsx             weight / reps / RIR inputs + Log
      RestTimer.tsx          sliding bar
      Summary.tsx            post-workout summary
    tabs/History/
      index.tsx
      WorkoutList.tsx
      WorkoutDetail.tsx
      ExerciseHistory.tsx
    tabs/Plan/
      index.tsx
      ExerciseDetail.tsx
      MesocycleControls.tsx
      Settings.tsx
    components/              shared primitives (Button, NumberInput, Toast)
  app.tsx                    routing, providers, error boundary
  main.tsx                   entry, registers SW
```

## State management

`@tanstack/react-query` over Dexie. Reads are queries keyed by entity + id; writes are mutations that invalidate the relevant keys. Optimistic updates on `logSet` so the UI feels instant under gym Wi-Fi (which doesn't matter for storage but does for perceived latency on slow phones).

No Redux, Zustand, or context-based store. The only mutable state outside React Query is the rest timer's `useRef`-backed countdown.

## PWA setup

`vite-plugin-pwa` with `registerType: "prompt"` (don't auto-reload mid-workout). Manifest:

- `display: "standalone"`
- `orientation: "portrait"`
- App icon + maskable icon (512x512 PNG)
- `theme_color`, `background_color` set to match the app's chrome

iOS-specific tags in `index.html`:

- `apple-touch-icon`
- `apple-mobile-web-app-capable`
- `apple-mobile-web-app-status-bar-style`
- `viewport-fit=cover` and CSS `env(safe-area-inset-*)` so content doesn't sit under the notch

Service worker caches the built app shell + static assets. Data is already local in IndexedDB, so the app is fully functional offline from first install.

Install instructions in the README: open in mobile Safari → Share → Add to Home Screen.

## Deployment

Cloudflare Pages connected to the GitHub repo. Auto-deploys on push to `main`. Production URL noted in the README.

## Error handling

- **IndexedDB write failure on log set**: toast with "Save failed — retry" button. The set row stays editable and shows an unsaved indicator. No silent data loss.
- **Service worker update available**: small banner at the top of the app: "Update available · reload". User-dismissible. Does not interrupt an in-progress workout.
- **Corrupted or empty IndexedDB on first load after a long pause**: detected via schema check; user is shown a recovery screen with a "restore from JSON export" option and a "reset" option.
- **Data export** (JSON) lives in Settings as the manual backup escape hatch.

## Testing

- **Vitest** unit tests for everything in `src/domain/`. Specifically:
  - `progression.suggestNext` across all branches (no history, stall, partial progression, full progression, deload)
  - `mesocycle.currentWeek`, `prescribedSetCount`, `isDeloadWeek`
  - `warmup.rampUpSets` at various weights
  - Rounding helpers
- **React Testing Library** smoke tests on the workout flow: start workout → log a set → finish workout → see it in History. Light, not exhaustive.
- **No E2E.** For a single-user PWA, manual gym testing is the real validation.

## Open implementation questions

- The exact list of seeded PF-adapted exercises with their categories, `baseSetCount`, `peakSetCount`, and `defaultStartingWeight` needs one pass during implementation. The source plan gives set/rep ranges; the PF adaptation and conservative starting weights will be filled in during the plan phase.
- Specific deload behavior on isolation lifts that are already very light: the 60% rule may not need to apply below some floor (e.g., cable lateral raises at 10 lb don't meaningfully deload to 6 lb). Handle as a minimum-weight clamp during implementation if it comes up.
- Chart rendering library for the per-exercise progression chart in History — defer the choice (or skip the chart entirely in v1 in favor of a simple list).
