import { useState } from "react"
import WorkoutList from "./WorkoutList"
import WorkoutDetail from "./WorkoutDetail"
import ExerciseHistory from "./ExerciseHistory"

type View =
  | { kind: "list" }
  | { kind: "workout"; id: string }
  | { kind: "exercise"; plannedExerciseId: string }

export default function HistoryTab() {
  const [view, setView] = useState<View>({ kind: "list" })
  const [mode, setMode] = useState<"workouts" | "exercises">("workouts")

  return (
    <div className="history">
      {view.kind === "list" && (
        <>
          <div className="seg-control">
            <button className={mode === "workouts" ? "active" : ""} onClick={() => setMode("workouts")}>By session</button>
            <button className={mode === "exercises" ? "active" : ""} onClick={() => setMode("exercises")}>By exercise</button>
          </div>
          <WorkoutList
            mode={mode}
            onOpenWorkout={id => setView({ kind: "workout", id })}
            onOpenExercise={plannedExerciseId => setView({ kind: "exercise", plannedExerciseId })}
          />
        </>
      )}
      {view.kind === "workout" && (
        <WorkoutDetail id={view.id} onBack={() => setView({ kind: "list" })} />
      )}
      {view.kind === "exercise" && (
        <ExerciseHistory plannedExerciseId={view.plannedExerciseId} onBack={() => setView({ kind: "list" })} />
      )}
    </div>
  )
}
