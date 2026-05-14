import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { db } from "../data/db"
import { WORKOUT_ROTATION, WorkoutDay } from "../domain/plan"

const DAY_LABEL: Record<WorkoutDay, string> = {
  UpperA: "Upper A", LowerA: "Lower A", UpperB: "Upper B", LowerB: "Lower B",
}

export default function FirstRun() {
  const qc = useQueryClient()
  const [day, setDay] = useState<WorkoutDay>("UpperA")

  const finish = useMutation({
    mutationFn: async () => {
      await db.settings.update("singleton", {
        rotationPointer: WORKOUT_ROTATION.indexOf(day),
        firstRunDone: true,
      })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings"] }),
  })

  return (
    <div className="first-run">
      <h1>Welcome</h1>
      <p className="first-run-meta">One quick question, then you're set.</p>

      <fieldset className="fr-group">
        <legend>Starting workout</legend>
        <div className="fr-choices fr-grid">
          {WORKOUT_ROTATION.map(d => (
            <button key={d} className={`fr-choice ${day === d ? "active" : ""}`} onClick={() => setDay(d)}>
              {DAY_LABEL[d]}
            </button>
          ))}
        </div>
      </fieldset>

      <button className="primary-btn" onClick={() => finish.mutate()} disabled={finish.isPending}>
        Get started
      </button>
    </div>
  )
}
