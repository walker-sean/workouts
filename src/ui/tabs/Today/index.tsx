import { useTodayState } from "./useTodayState"
import Idle from "./Idle"
import ActiveWorkout from "./ActiveWorkout"

export default function TodayTab() {
  const q = useTodayState()
  if (q.isLoading) return <div className="loading">Loading…</div>
  if (q.isError || !q.data) return <div>Error: {String(q.error)}</div>
  if (q.data.inProgress) return <ActiveWorkout workout={q.data.inProgress} />
  return <Idle state={q.data} />
}
