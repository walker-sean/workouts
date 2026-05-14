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
