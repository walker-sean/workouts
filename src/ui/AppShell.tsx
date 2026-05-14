import { useState } from "react"
import { TabKey, TABS } from "./tabs"
import TodayTab from "./tabs/Today"
import HistoryTab from "./tabs/History"
import PlanTab from "./tabs/Plan"
import UpdateBanner from "./UpdateBanner"

export default function AppShell() {
  const [tab, setTab] = useState<TabKey>("today")
  return (
    <div className="app-shell">
      <main className="tab-content">
        <UpdateBanner />
        {tab === "today" && <TodayTab />}
        {tab === "history" && <HistoryTab />}
        {tab === "plan" && <PlanTab />}
      </main>
      <nav className="tab-bar" aria-label="Sections">
        {TABS.map(t => (
          <button
            key={t.key}
            className={`tab-btn ${tab === t.key ? "active" : ""}`}
            onClick={() => setTab(t.key)}
            aria-current={tab === t.key ? "page" : undefined}
          >
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  )
}
