import { useMemo } from 'react'
import { useStore } from '../hooks/useStore'
import BarChart from '../components/BarChart'
import { isLow, minOf, monthKey, monthLabel, num } from '../utils/format'

export default function Dashboard({ go }) {
  const { items, txs, settings, money } = useStore()

  const stats = useMemo(() => {
    const byId = Object.fromEntries(items.map((i) => [i.id, i]))
    const months = {}
    txs.forEach((t) => {
      const k = monthKey(t.at)
      const m = (months[k] ||= { a: 0, b: 0, av: 0, bv: 0 })
      const v = t.qty * (byId[t.itemId]?.price || 0)
      if (t.type === 'IN') { m.a += t.qty; m.av += v } else { m.b += t.qty; m.bv += v }
    })
    const keys = Object.keys(months).sort().slice(-6)
    const cur = months[monthKey(new Date().toISOString())] || { a: 0, b: 0, av: 0, bv: 0 }
    return {
      value: items.reduce((s, i) => s + i.quantity * i.price, 0),
      low: items.filter((i) => isLow(i, settings)),
      chart: keys.map((k) => ({ label: monthLabel(k), a: months[k].a, b: months[k].b })),
      cur,
    }
  }, [items, txs, settings])

  if (!items.length)
    return (
      <div className="panel mt-10 text-center">
        <h1 className="mb-1 text-xl font-bold">Start with your first item</h1>
        <p className="mb-4 text-sm text-stone-500">Add what you stock, then record stock in and out. Everything stays on this device.</p>
        <button className="btn btn-primary" onClick={() => go('inventory')}>Add an item</button>
      </div>
    )

  const Stat = ({ label, value, sub, tone = '' }) => (
    <div className="panel">
      <p className="text-xs text-stone-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${tone}`}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-stone-500">{sub}</p>}
    </div>
  )

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Inventory value" value={money(stats.value)} />
        <Stat label="Items" value={items.length} />
        <Stat label="Low stock" value={stats.low.length} tone={stats.low.length ? 'text-lowstock' : ''} />
        <Stat label="This month" value={`+${num(stats.cur.a)} / −${num(stats.cur.b)}`} sub={`In ${money(stats.cur.av)} · Out ${money(stats.cur.bv)}`} />
      </div>
      <div className="grid gap-4 lg:grid-cols-5">
        <section className="panel lg:col-span-3">
          <h2 className="mb-3 font-semibold">Monthly stock movement</h2>
          <BarChart data={stats.chart} />
        </section>
        <section className="panel lg:col-span-2">
          <h2 className="mb-3 font-semibold">Needs restocking</h2>
          {stats.low.length === 0 ? (
            <p className="text-sm text-stone-500">Every item is above its minimum level.</p>
          ) : (
            <ul className="divide-y divide-stone-200 dark:divide-stone-700">
              {stats.low.slice(0, 8).map((i) => (
                <li key={i.id} className="flex items-center justify-between py-2 text-sm">
                  <span className="truncate pr-2">{i.name}</span>
                  <span className="shrink-0 font-semibold text-lowstock">{num(i.quantity)} / {num(minOf(i, settings))} {i.unit}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
