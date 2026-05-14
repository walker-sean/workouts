import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getActiveMesocycle } from "../../../data/queries"
import { startDeloadNow, resetMesocycle, completeMesocycleAndStartNew } from "../../../data/mutations"
import { currentWeek, isDeloadWeek } from "../../../domain/mesocycle"

export default function MesocycleControls() {
  const qc = useQueryClient()
  const q = useQuery({ queryKey: ["meso"], queryFn: getActiveMesocycle })
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["meso"] })
    qc.invalidateQueries({ queryKey: ["today-state"] })
  }
  const startDeload = useMutation({ mutationFn: startDeloadNow, onSuccess: invalidate })
  const reset = useMutation({ mutationFn: resetMesocycle, onSuccess: invalidate })
  const newMeso = useMutation({ mutationFn: completeMesocycleAndStartNew, onSuccess: invalidate })

  if (!q.data) return null
  const today = new Date()
  const week = currentWeek(q.data, today)
  const deload = isDeloadWeek(q.data, today)

  return (
    <section className="card">
      <div className="card-header"><span>Mesocycle</span></div>
      <div className="card-body">
        <p className="meso-status">
          Week {week} of {q.data.weekLength}{deload ? " · DELOAD" : ""}
        </p>
        <div className="meso-actions">
          <button className="secondary-btn" onClick={() => startDeload.mutate()} disabled={deload}>
            Start deload now
          </button>
          <button className="secondary-btn" onClick={() => reset.mutate()}>Reset mesocycle</button>
          <button className="secondary-btn" onClick={() => newMeso.mutate()} disabled={!deload}>
            Skip deload &amp; start new
          </button>
        </div>
      </div>
    </section>
  )
}
