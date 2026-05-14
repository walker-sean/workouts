import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { LoggedExercise } from "../../../data/db"
import { logSet, swapExercise } from "../../../data/mutations"
import { lastSessionForExercise, getActiveMesocycle, historyForExercise } from "../../../data/queries"
import { suggestNext, countStall } from "../../../domain/progression"
import { SEEDED_PLAN } from "../../../domain/plan"
import { prescribedSetCount, isDeloadWeek, deloadWeight, deloadRir } from "../../../domain/mesocycle"
import SetRow, { SetDraft } from "./SetRow"
import { restTimer } from "./restTimerStore"

export default function ExerciseCard({ workoutId, plannedExerciseId, exercise }: {
  workoutId: string
  plannedExerciseId: string
  exercise: LoggedExercise
}) {
  const qc = useQueryClient()
  const [swapOpen, setSwapOpen] = useState(false)
  const plan = SEEDED_PLAN.find(p => p.id === plannedExerciseId)
    ?? SEEDED_PLAN.find(p => p.id === exercise.swappedFromId)

  const ctx = useQuery({
    queryKey: ["exercise-context", plannedExerciseId],
    enabled: !!plan,
    queryFn: async () => {
      const p = plan!
      const [last, meso, history] = await Promise.all([
        lastSessionForExercise(plannedExerciseId),
        getActiveMesocycle(),
        historyForExercise(plannedExerciseId),
      ])
      const today = new Date()
      const deload = meso ? isDeloadWeek(meso, today) : false
      const targetSetCount = meso ? prescribedSetCount(p, meso, today) : p.baseSetCount
      const baseSuggestion = suggestNext(
        { repRange: p.repRange, rir: p.rir, increment: p.increment, defaultStartingWeight: p.defaultStartingWeight },
        last,
      )
      const suggestion: SetDraft = deload
        ? { weight: deloadWeight(baseSuggestion.weight), reps: baseSuggestion.reps, rir: deloadRir(baseSuggestion.rir) }
        : baseSuggestion
      const stallCount = countStall(history)
      return { last, suggestion, targetSetCount, deload, stallCount }
    },
  })

  const log = useMutation({
    mutationFn: (s: SetDraft) => logSet(workoutId, plannedExerciseId, s),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workout", workoutId] })
      if (plan) restTimer.start(plan.restSeconds)
    },
  })

  if (!plan) return <div>Unknown exercise</div>
  if (ctx.isLoading || !ctx.data) return <div>Loading exercise…</div>

  const { suggestion, targetSetCount, last, deload, stallCount } = ctx.data
  const totalRows = Math.max(targetSetCount, exercise.sets.length)
  const lastSummary = last
    ? last.sets.map(s => `${s.weight}×${s.reps}`).join(", ")
    : "no prior session — using default"

  return (
    <div className="exercise-body">
      {stallCount >= 3 && (
        <div className="banner banner-warn">
          Stalled {stallCount} sessions — consider a swap or extra set.
        </div>
      )}
      <div className="ex-toolbar">
        <button className="link-btn" onClick={() => setSwapOpen(true)}>Swap</button>
      </div>
      {swapOpen && (
        <SwapSheet
          currentPlannedExerciseId={plannedExerciseId}
          category={plan.category}
          onClose={() => setSwapOpen(false)}
          onSwap={async (target) => {
            await swapExercise(workoutId, plannedExerciseId, { newPlannedExerciseId: target.id, newName: target.name })
            setSwapOpen(false)
            qc.invalidateQueries({ queryKey: ["workout", workoutId] })
          }}
        />
      )}
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
          {candidates.length === 0 && <li className="empty">No swap options in category "{category}".</li>}
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
