import { useQuery } from "@tanstack/react-query"
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
