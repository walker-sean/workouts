import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { db, LoggedWorkout } from "../../../data/db"
import { finishWorkout, discardWorkout } from "../../../data/mutations"
import ExerciseCard from "./ExerciseCard"
import WarmupCard from "./WarmupCard"
import RestTimer from "./RestTimer"

const DAY_LABEL: Record<string, string> = {
  UpperA: "Upper A", LowerA: "Lower A", UpperB: "Upper B", LowerB: "Lower B",
}

export default function ActiveWorkout({ workout, onFinish }: { workout: LoggedWorkout; onFinish: (w: LoggedWorkout) => void }) {
  const qc = useQueryClient()
  // expandedKey: "warmup" or an exercise.plannedExerciseId
  const [expanded, setExpanded] = useState<string>("warmup")

  const live = useQuery({
    queryKey: ["workout", workout.id],
    queryFn: () => db.loggedWorkouts.get(workout.id),
    initialData: workout,
  })
  const w = live.data!

  const finish = useMutation({
    mutationFn: async () => {
      await finishWorkout(w.id)
      return await db.loggedWorkouts.get(w.id)
    },
    onSuccess: async (finishedWorkout) => {
      qc.invalidateQueries({ queryKey: ["today-state"] })
      qc.invalidateQueries({ queryKey: ["workout", w.id] })
      if (finishedWorkout) onFinish(finishedWorkout)
    },
  })

  const discard = useMutation({
    mutationFn: () => discardWorkout(w.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["today-state"] }),
  })

  return (
    <div className="active-workout">
      <RestTimer />
      <header className="aw-header">
        <h1>{DAY_LABEL[w.day]} {w.isDeload && <span className="deload-tag">deload</span>}</h1>
        <button className="link-btn" onClick={() => discard.mutate()}>Discard</button>
      </header>

      <section className={`card ${expanded === "warmup" ? "expanded" : ""}`}>
        <button className="card-header" onClick={() => setExpanded(expanded === "warmup" ? "" : "warmup")}>
          Warmup
        </button>
        {expanded === "warmup" && (
          <div className="card-body">
            <WarmupCard
              workout={w}
              onDone={() => {
                const first = w.exercises[0]
                setExpanded(first ? first.plannedExerciseId : "")
              }}
            />
          </div>
        )}
      </section>

      {w.exercises.map(ex => (
        <section key={ex.plannedExerciseId} className={`card ${expanded === ex.plannedExerciseId ? "expanded" : ""}`}>
          <button className="card-header" onClick={() => setExpanded(expanded === ex.plannedExerciseId ? "" : ex.plannedExerciseId)}>
            <span>{ex.nameAtTime}</span>
            <span className="card-meta">{ex.sets.length > 0 ? `${ex.sets.length} sets` : "—"}</span>
          </button>
          {expanded === ex.plannedExerciseId && (
            <div className="card-body">
              <ExerciseCard workoutId={w.id} plannedExerciseId={ex.plannedExerciseId} exercise={ex} />
            </div>
          )}
        </section>
      ))}

      <button className="primary-btn" onClick={() => finish.mutate()} disabled={finish.isPending}>
        {finish.isPending ? "Finishing…" : "Finish workout"}
      </button>
    </div>
  )
}
