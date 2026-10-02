import { useState } from 'react'
import { useStore } from '../hooks/useStore'
import { hashPin } from '../utils/format'

export default function LockScreen({ onUnlock }) {
  const { settings } = useStore()
  const [pin, setPin] = useState('')
  const [err, setErr] = useState('')
  const submit = async (e) => {
    e.preventDefault()
    if ((await hashPin(pin)) === settings.pin) onUnlock()
    else { setErr('Wrong PIN. Try again.'); setPin('') }
  }
  return (
    <div className="grid min-h-dvh place-items-center p-6">
      <form onSubmit={submit} className="panel w-full max-w-xs text-center">
        <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded bg-forklift text-xl text-ink">▣</div>
        <h1 className="mb-1 text-lg font-bold">Stockroom is locked</h1>
        <p className="mb-4 text-sm text-stone-500">Enter your PIN to continue.</p>
        <input className="input mb-2 text-center text-2xl tracking-[0.5em]" type="password" inputMode="numeric" autoFocus maxLength={8} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} aria-label="PIN" />
        {err && <p className="mb-2 text-sm text-stockout">{err}</p>}
        <button className="btn btn-primary w-full" disabled={pin.length < 4}>Unlock</button>
      </form>
    </div>
  )
}
