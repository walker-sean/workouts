import { useEffect, useState } from "react"
import { seedIfEmpty } from "./data/db"
import AppShell from "./ui/AppShell"

export default function App() {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    seedIfEmpty().then(() => setReady(true))
  }, [])
  if (!ready) return <div className="loading">Loading…</div>
  return <AppShell />
}
