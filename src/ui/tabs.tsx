export type TabKey = "today" | "history" | "plan"
export const TABS: ReadonlyArray<{ key: TabKey; label: string }> = [
  { key: "today", label: "Today" },
  { key: "history", label: "History" },
  { key: "plan", label: "Plan" },
]
