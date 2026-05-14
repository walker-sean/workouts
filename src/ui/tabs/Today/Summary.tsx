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
