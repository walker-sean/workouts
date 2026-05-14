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
