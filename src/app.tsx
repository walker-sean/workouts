import { useEffect, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { seedIfEmpty } from "./data/db"
import { getSettings } from "./data/queries"
import AppShell from "./ui/AppShell"
import FirstRun from "./ui/FirstRun"

export default function App() {
  const [seeded, setSeeded] = useState(false)
  useEffect(() => { seedIfEmpty().then(() => setSeeded(true)) }, [])

  const settingsQ = useQuery({ queryKey: ["settings"], queryFn: getSettings, enabled: seeded })

  if (!seeded || !settingsQ.data) return <div className="loading">Loading…</div>
  if (!settingsQ.data.firstRunDone) return <FirstRun />
  return <AppShell />
}
