import { useSyncExternalStore } from "react"

type State = { endsAt: number | null }

let state: State = { endsAt: null }
const listeners = new Set<() => void>()

function notify() { listeners.forEach(l => l()) }

export const restTimer = {
  start(seconds: number) {
    state = { endsAt: Date.now() + seconds * 1000 }
    notify()
  },
  add(seconds: number) {
    if (state.endsAt == null) return
    state = { endsAt: state.endsAt + seconds * 1000 }
    notify()
  },
  skip() {
    state = { endsAt: null }
    notify()
  },
  subscribe(fn: () => void) {
    listeners.add(fn)
    return () => listeners.delete(fn)
  },
  getSnapshot(): State {
    return state
  },
}

export function useRestTimer() {
  return useSyncExternalStore(restTimer.subscribe, restTimer.getSnapshot, restTimer.getSnapshot)
}
