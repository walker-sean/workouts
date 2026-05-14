import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { LoggedWorkout } from "../../../data/db"
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
    if (next.has(key)) next.delete(key)
    else next.add(key)
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
