import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getSettings } from "../../../data/queries"
import { db } from "../../../data/db"

export default function SettingsPanel() {
  const qc = useQueryClient()
  const q = useQuery({ queryKey: ["settings"], queryFn: getSettings })
  const setUnits = useMutation({
    mutationFn: (units: "lb" | "kg") => db.settings.update("singleton", { units }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings"] }),
  })

  const exportData = async () => {
    const [workouts, mesos, plan, settings] = await Promise.all([
      db.loggedWorkouts.toArray(),
      db.mesocycles.toArray(),
      db.plannedExercises.toArray(),
      db.settings.toArray(),
    ])
    const blob = new Blob([JSON.stringify({ workouts, mesos, plan, settings }, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `workouts-export-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const resetAll = async () => {
    if (!confirm("Erase all data and re-seed?")) return
    await db.delete()
    await db.open()
    location.reload()
  }

  if (!q.data) return null

  return (
    <section className="card">
      <div className="card-header"><span>Settings</span></div>
      <div className="card-body settings-body">
        <label className="settings-row">
          <span>Units</span>
          <select value={q.data.units} onChange={e => setUnits.mutate(e.target.value as "lb" | "kg")}>
            <option value="lb">lb</option>
            <option value="kg">kg</option>
          </select>
        </label>
        <button className="secondary-btn" onClick={exportData}>Export data (JSON)</button>
        <button className="secondary-btn danger" onClick={resetAll}>Reset all data</button>
      </div>
    </section>
  )
}
