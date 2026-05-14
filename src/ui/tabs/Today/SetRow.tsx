import { useState } from "react"

export type SetDraft = { weight: number; reps: number; rir: number }

export default function SetRow({
  index,
  initial,
  logged,
  onLog,
}: {
  index: number
  initial: SetDraft
  logged?: SetDraft
  onLog: (s: SetDraft) => void
}) {
  const [draft, setDraft] = useState<SetDraft>(logged ?? initial)
  const isLogged = !!logged

  return (
    <div className={`set-row ${isLogged ? "logged" : ""}`}>
      <span className="set-num">{index + 1}</span>
      <NumberCell label="weight" value={draft.weight} onChange={v => setDraft({ ...draft, weight: v })} step={2.5} disabled={isLogged} />
      <NumberCell label="reps"   value={draft.reps}   onChange={v => setDraft({ ...draft, reps: v })}   step={1}   disabled={isLogged} />
      <NumberCell label="RIR"    value={draft.rir}    onChange={v => setDraft({ ...draft, rir: v })}    step={1}   disabled={isLogged} />
      {!isLogged && (
        <button className="log-btn" onClick={() => onLog(draft)}>Log</button>
      )}
    </div>
  )
}

function NumberCell({ label, value, onChange, step, disabled }: { label: string; value: number; onChange: (v: number) => void; step: number; disabled?: boolean }) {
  return (
    <label className="cell">
      <span className="cell-label">{label}</span>
      <input
        type="number"
        inputMode="decimal"
        step={step}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value) || 0)}
        disabled={disabled}
      />
    </label>
  )
}
