import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { PlannedExercise, SEEDED_PLAN } from "../../../domain/plan"
import { db } from "../../../data/db"

type Props = {
  exercise: PlannedExercise
  onClose: () => void
}

export default function ExerciseDetail({ exercise, onClose }: Props) {
  const qc = useQueryClient()
  const [notes, setNotes] = useState(exercise.notes ?? "")
  const [restSeconds, setRestSeconds] = useState(exercise.restSeconds)
  const [increment, setIncrement] = useState(exercise.increment)

  const swapCandidates = SEEDED_PLAN.filter(
    p => p.category === exercise.category && p.id !== exercise.id
  )

  async function handleSave() {
    await db.plannedExercises.update(exercise.id, { notes, restSeconds, increment })
    qc.invalidateQueries({ queryKey: ["plan-exercises"] })
    onClose()
  }

  async function handleSwap(target: PlannedExercise) {
    await db.plannedExercises.update(exercise.id, {
      name: target.name,
      category: target.category,
      repRange: target.repRange,
      rir: target.rir,
      restSeconds: target.restSeconds,
      increment: target.increment,
      defaultStartingWeight: target.defaultStartingWeight,
    })
    qc.invalidateQueries({ queryKey: ["plan-exercises"] })
    onClose()
  }

  return (
    <div className="sheet" role="dialog" aria-modal="true">
      <div className="sheet-card">
        <h3>{exercise.name}</h3>

        <div className="detail-field">
          <label className="cell-label" htmlFor="detail-notes">Notes</label>
          <textarea
            id="detail-notes"
            className="detail-textarea"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={3}
            placeholder="Optional notes…"
          />
        </div>

        <div className="detail-field">
          <label className="cell-label" htmlFor="detail-rest">Rest (seconds)</label>
          <input
            id="detail-rest"
            type="number"
            className="detail-input"
            value={restSeconds}
            min={0}
            step={5}
            onChange={e => setRestSeconds(Number(e.target.value))}
          />
        </div>

        <div className="detail-field">
          <label className="cell-label" htmlFor="detail-increment">Increment (lb)</label>
          <input
            id="detail-increment"
            type="number"
            className="detail-input"
            value={increment}
            min={0}
            step={2.5}
            onChange={e => setIncrement(Number(e.target.value))}
          />
        </div>

        {swapCandidates.length > 0 && (
          <div className="detail-field">
            <p className="cell-label">Swap to</p>
            <ul className="hist-list">
              {swapCandidates.map(c => (
                <li key={c.id}>
                  <button className="hist-row" onClick={() => handleSwap(c)}>
                    <strong>{c.name}</strong>
                    <span className="hist-meta">{c.repRange[0]}–{c.repRange[1]} reps</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="detail-actions">
          <button className="primary-btn" onClick={handleSave}>Save</button>
          <button className="secondary-btn" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  )
}
