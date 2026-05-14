import { useMutation, useQueryClient } from "@tanstack/react-query"
import { startWorkout } from "../../../data/mutations"
import type { useTodayState } from "./useTodayState"

type State = NonNullable<ReturnType<typeof useTodayState>["data"]>

const DAY_LABEL: Record<string, string> = {
  UpperA: "Upper A", LowerA: "Lower A", UpperB: "Upper B", LowerB: "Lower B",
}

export default function Idle({ state }: { state: State }) {
  const qc = useQueryClient()
  const start = useMutation({
    mutationFn: startWorkout,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["today-state"] }),
  })

  const heading = state.isDeload
    ? `Deload week — ${DAY_LABEL[state.nextDay]}`
    : `${DAY_LABEL[state.nextDay]} · Week ${state.week} of ${state.weekLength}`

  return (
    <div className="idle">
      <h1 className="idle-heading">{heading}</h1>
      <button className="primary-btn" onClick={() => start.mutate()} disabled={start.isPending}>
        {start.isPending ? "Starting…" : "Start workout"}
      </button>

      {state.recent.length > 0 && (
        <section className="recent">
          <h2 className="section-title">Recent</h2>
          <ul className="recent-list">
            {state.recent.map(w => (
              <li key={w.id} className="recent-item">
                <strong>{DAY_LABEL[w.day]}</strong>
                <span className="recent-meta">
                  {w.date} · {w.exercises.reduce((sum, e) => sum + e.sets.length, 0)} sets
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
