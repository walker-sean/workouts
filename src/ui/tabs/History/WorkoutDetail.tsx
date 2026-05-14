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
