import { useMemo, useState } from 'react'
import { useStore } from '../hooks/useStore'
import Field from '../components/Field'
import { fmtDate, num, toLocalInput } from '../utils/format'

export default function Transactions({ go }) {
  const { items, txs, addTx, removeTx } = useStore()
  const [type, setType] = useState('IN')
  const [f, setF] = useState({ itemId: '', qty: '', at: toLocalInput(), remarks: '' })
  const [err, setErr] = useState('')
  const [filter, setFilter] = useState('ALL')
  const byId = useMemo(() => Object.fromEntries(items.map((i) => [i.id, i])), [items])
  const item = byId[f.itemId]

  const frequent = useMemo(() => {
    const c = {}
    txs.forEach((t) => (c[t.itemId] = (c[t.itemId] || 0) + 1))
    return Object.entries(c).sort((a, b) => b[1] - a[1]).map(([id]) => byId[id]).filter(Boolean).slice(0, 5)
  }, [txs, byId])

  const submit = (e) => {
    e.preventDefault()
    const r = addTx({ ...f, type })
    if (r) return setErr(r)
    setErr('')
    setF({ itemId: f.itemId, qty: '', at: toLocalInput(), remarks: '' })
  }
  const del = (t) => {
    if (!confirm('Delete this transaction? Stock will be adjusted back.')) return
    const r = removeTx(t.id)
    if (r) alert(r)
  }
  const list = useMemo(
    () => txs.filter((t) => filter === 'ALL' || t.type === filter).sort((a, b) => b.at.localeCompare(a.at)).slice(0, 100),
    [txs, filter]
  )

  if (!items.length)
    return (
      <div className="panel mt-10 text-center">
        <h1 className="mb-1 text-xl font-bold">Add an item first</h1>
        <p className="mb-4 text-sm text-stone-500">Stock in and out are recorded against items.</p>
        <button className="btn btn-primary" onClick={() => go('inventory')}>Go to inventory</button>
      </div>
    )

  return (
    <div className="grid gap-4 lg:grid-cols-5">
      <form onSubmit={submit} className="panel space-y-3 self-start lg:col-span-2">
        <h1 className="text-xl font-bold">Record stock</h1>
        <div className="grid grid-cols-2 gap-2">
          {[['IN', 'Stock in', 'bg-stockin'], ['OUT', 'Stock out', 'bg-stockout']].map(([v, l, c]) => (
            <button type="button" key={v} onClick={() => setType(v)} className={`btn ${type === v ? `${c} text-white` : 'btn-soft'}`}>{l}</button>
          ))}
        </div>
        {frequent.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {frequent.map((i) => (
              <button type="button" key={i.id} onClick={() => setF({ ...f, itemId: i.id })} className={`rounded-full border px-3 py-1 text-xs ${f.itemId === i.id ? 'border-forklift bg-forklift text-ink' : 'border-stone-300 dark:border-stone-600'}`}>{i.name}</button>
            ))}
          </div>
        )}
        <Field label="Item">
          <select className="input" value={f.itemId} onChange={(e) => setF({ ...f, itemId: e.target.value })} required>
            <option value="">Choose an item</option>
            {[...items].sort((a, b) => a.name.localeCompare(b.name)).map((i) => <option key={i.id} value={i.id}>{i.name} ({num(i.quantity)} {i.unit})</option>)}
          </select>
        </Field>
        <Field label={`Quantity${item ? ` (${item.unit})` : ''}`}>
          <input className="input" type="number" min="0" step="any" inputMode="decimal" value={f.qty} onChange={(e) => setF({ ...f, qty: e.target.value })} required />
        </Field>
        <Field label="Date and time">
          <div className="flex gap-2">
            <input className="input" type="datetime-local" value={f.at} onChange={(e) => setF({ ...f, at: e.target.value })} required />
            <button type="button" className="btn btn-soft" onClick={() => setF({ ...f, at: toLocalInput() })}>Now</button>
          </div>
        </Field>
        <Field label="Remarks"><input className="input" value={f.remarks} onChange={(e) => setF({ ...f, remarks: e.target.value })} /></Field>
        {err && <p className="text-sm text-stockout">{err}</p>}
        <button className="btn btn-primary w-full">{type === 'IN' ? 'Add stock' : 'Remove stock'}</button>
      </form>

      <section className="lg:col-span-3">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold">History</h2>
          <div className="flex gap-1">
            {[['ALL', 'All'], ['IN', 'In'], ['OUT', 'Out']].map(([v, l]) => (
              <button key={v} onClick={() => setFilter(v)} className={`btn !px-3 !py-1.5 ${filter === v ? 'btn-primary' : 'btn-soft'}`}>{l}</button>
            ))}
          </div>
        </div>
        {list.length === 0 ? (
          <p className="panel text-center text-sm text-stone-500">No transactions yet. Record your first stock movement.</p>
        ) : (
          <ul className="space-y-2">
            {list.map((t) => (
              <li key={t.id} className="panel flex items-center gap-3 !p-3">
                <span className={`grid h-9 w-9 shrink-0 place-items-center rounded text-sm font-bold text-white ${t.type === 'IN' ? 'bg-stockin' : 'bg-stockout'}`}>{t.type === 'IN' ? '+' : '−'}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{byId[t.itemId]?.name || 'Deleted item'}</p>
                  <p className="truncate text-xs text-stone-500">{fmtDate(t.at)}{t.remarks && ` · ${t.remarks}`}</p>
                </div>
                <p className="shrink-0 text-sm font-semibold">{num(t.qty)} {byId[t.itemId]?.unit}</p>
                <button className="btn btn-soft !px-2.5 !py-1 text-stockout" onClick={() => del(t)} aria-label="Delete transaction">✕</button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
