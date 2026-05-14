import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { WORKOUT_ROTATION, WorkoutDay, PlannedExercise } from "../../../domain/plan"
import { db } from "../../../data/db"
import ExerciseDetail from "./ExerciseDetail"

const DAY_LABEL: Record<WorkoutDay, string> = {
  UpperA: "Upper A", LowerA: "Lower A", UpperB: "Upper B", LowerB: "Lower B",
}

export default function PlanList() {
  const [selected, setSelected] = useState<PlannedExercise | null>(null)

  const { data: exercises = [] } = useQuery({
    queryKey: ["plan-exercises"],
    queryFn: () => db.plannedExercises.toArray(),
  })

  return (
    <>
      <section className="plan-list">
        {WORKOUT_ROTATION.map(day => {
          const dayExercises = exercises
            .filter(p => p.day === day)
            .sort((a, b) => a.order - b.order)
          return (
            <details key={day} className="plan-day">
              <summary>
                <strong>{DAY_LABEL[day]}</strong>{" "}
                <span className="hist-meta">{dayExercises.length} exercises</span>
              </summary>
              <ul className="plan-exercises">
                {dayExercises.map(ex => (
                  <li key={ex.id}>
                    <button
                      className="plan-exercise-btn"
                      onClick={() => setSelected(ex)}
                    >
                      <span>{ex.name}</span>
                      <span className="hist-meta">
                        {ex.repRange[0]}–{ex.repRange[1]} reps @ {ex.rir} RIR
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </details>
          )
        })}
      </section>

      {selected && (
        <ExerciseDetail
          exercise={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  )
}
