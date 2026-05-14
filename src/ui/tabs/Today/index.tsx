import { useState } from "react"
import { useTodayState } from "./useTodayState"
import Idle from "./Idle"
import ActiveWorkout from "./ActiveWorkout"
import Summary from "./Summary"
import { LoggedWorkout } from "../../../data/db"

export default function TodayTab() {
  const q = useTodayState()
  const [justFinished, setJustFinished] = useState<LoggedWorkout | null>(null)

  if (q.isLoading) return <div className="loading">Loading…</div>
  if (q.isError || !q.data) return <div>Error: {String(q.error)}</div>

  if (justFinished) return <Summary workout={justFinished} onDismiss={() => setJustFinished(null)} />
  if (q.data.inProgress) {
    return <ActiveWorkout workout={q.data.inProgress} onFinish={w => setJustFinished(w)} />
  }
  return <Idle state={q.data} />
}
