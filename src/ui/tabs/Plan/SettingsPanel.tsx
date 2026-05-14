import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getSettings } from "../../../data/queries"
import { db } from "../../../data/db"

export default function SettingsPanel() {
  const qc = useQueryClient()
  const q = useQuery({ queryKey: ["settings"], queryFn: getSettings })

  const [newItem, setNewItem] = useState("")

  const updateMobility = useMutation({
    mutationFn: (items: string[]) => db.settings.update("singleton", { warmupMobilityItems: items }),
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
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const resetAll = async () => {
    if (!confirm("Erase all data and re-seed?")) return
    await db.delete()
    await db.open()
    location.reload()
  }

  if (!q.data) return null

  const mobilityItems = q.data.warmupMobilityItems

  const removeItem = (index: number) => {
    const updated = mobilityItems.filter((_, i) => i !== index)
    updateMobility.mutate(updated)
  }

  const addItem = () => {
    const trimmed = newItem.trim()
    if (!trimmed) return
    updateMobility.mutate([...mobilityItems, trimmed])
    setNewItem("")
  }

  return (
    <section className="card">
      <div className="card-header"><span>Settings</span></div>
      <div className="card-body settings-body">
        <section className="settings-section">
          <h3 className="settings-section-title">Warmup mobility</h3>
          <ul className="mobility-list">
            {mobilityItems.map((item, i) => (
              <li key={i} className="mobility-item">
                <span>{item}</span>
                <button
                  className="link-btn mobility-remove"
                  onClick={() => removeItem(i)}
                  aria-label={`Remove ${item}`}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
          <div className="mobility-add-row">
            <input
              className="mobility-input"
              type="text"
              placeholder="New item…"
              value={newItem}
              onChange={e => setNewItem(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") addItem() }}
            />
            <button className="secondary-btn" onClick={addItem} disabled={!newItem.trim()}>
              Add
            </button>
          </div>
        </section>
        <button className="secondary-btn" onClick={exportData}>Export data (JSON)</button>
        <button className="secondary-btn danger" onClick={resetAll}>Reset all data</button>
      </div>
    </section>
  )
}
