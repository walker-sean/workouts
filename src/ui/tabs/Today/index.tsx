import { useTodayState } from "./useTodayState"
import Idle from "./Idle"

export default function TodayTab() {
  const q = useTodayState()
  if (q.isLoading) return <div className="loading">Loading…</div>
  if (q.isError || !q.data) return <div>Error: {String(q.error)}</div>
  if (q.data.inProgress) return <div>Active workout view (next task)</div>
  return <Idle state={q.data} />
}
