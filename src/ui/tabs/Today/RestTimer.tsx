import { useEffect, useState } from "react"
import { restTimer, useRestTimer } from "./restTimerStore"

export default function RestTimer() {
  const { endsAt } = useRestTimer()
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    if (endsAt == null) return
    const id = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(id)
  }, [endsAt])

  if (endsAt == null) return null

  const remaining = Math.max(0, endsAt - now)
  const seconds = Math.ceil(remaining / 1000)
  const mm = Math.floor(seconds / 60).toString().padStart(2, "0")
  const ss = (seconds % 60).toString().padStart(2, "0")

  return (
    <div className="rest-timer" role="status">
      <span className="rt-time">{mm}:{ss}</span>
      <button className="rt-btn" onClick={() => restTimer.add(30)}>+30s</button>
      <button className="rt-btn" onClick={() => restTimer.skip()}>Skip</button>
    </div>
  )
}
