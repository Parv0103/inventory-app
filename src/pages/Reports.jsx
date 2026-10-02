import { useMemo, useState } from 'react'
import { useStore } from '../hooks/useStore'
import BarChart from '../components/BarChart'
import Field from '../components/Field'
import { fmtDate, monthKey, monthLabel, num } from '../utils/format'

export default function Reports() {
  const { items, txs, categories, money } = useStore()
  const [f, setF] = useState({ month: '', from: '', to: '', category: '', itemId: '', type: '' })
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const byId = useMemo(() => Object.fromEntries(items.map((i) => [i.id, i])), [items])

  const months = useMemo(() => [...new Set(txs.map((t) => monthKey(t.at)))].sort().reverse(), [txs])

  const rows = useMemo(() => {
    const from = f.from ? new Date(f.from + 'T00:00:00') : null
    const to = f.to ? new Date(f.to + 'T23:59:59') : null
    return txs
      .filter((t) => {
        const it = byId[t.itemId]
        const d = new Date(t.at)
        return (
          it &&
          (!f.month || monthKey(t.at) === f.month) &&
          (!from || d >= from) &&
          (!to || d <= to) &&
          (!f.category || it.category === f.category) &&
          (!f.itemId || t.itemId === f.itemId) &&
          (!f.type || t.type === f.type)
        )
      })
      .sort((a, b) => b.at.localeCompare(a.at))
  }, [txs, byId, f])

  const monthly = useMemo(() => {
    const m = {}
    rows.forEach((t) => {
      const x = (m[monthKey(t.at)] ||= { a: 0, b: 0, av: 0, bv: 0 })
      const v = t.qty * byId[t.itemId].price
      if (t.type === 'IN') { x.a += t.qty; x.av += v } else { x.b += t.qty; x.bv += v }
    })
    return Object.keys(m).sort().map((k) => ({ key: k, label: monthLabel(k), ...m[k] }))
  }, [rows, byId])

  const stock = useMemo(
    () => items.filter((i) => (!f.category || i.category === f.category) && (!f.itemId || i.id === f.itemId)),
    [items, f.category, f.itemId]
  )
  const tot = rows.reduce((s, t) => { const v = t.qty * byId[t.itemId].price; t.type === 'IN' ? (s.i += v) : (s.o += v); return s }, { i: 0, o: 0 })

  // Plain-number datasets reused by Excel and PDF exports.
  const datasets = () => ({
    Transactions: rows.map((t) => ({ Date: fmtDate(t.at), Type: t.type, Item: byId[t.itemId].name, Category: byId[t.itemId].category, Quantity: t.qty, Unit: byId[t.itemId].unit, Value: +(t.qty * byId[t.itemId].price).toFixed(2), Remarks: t.remarks })),
    'Monthly summary': monthly.map((m) => ({ Month: m.key, 'Qty in': m.a, 'Qty out': m.b, 'Value in': +m.av.toFixed(2), 'Value out': +m.bv.toFixed(2) })),
    'Stock snapshot': stock.map((i) => ({ Item: i.name, Category: i.category, Quantity: i.quantity, Unit: i.unit, 'Price per unit': i.price, 'Total value': +(i.quantity * i.price).toFixed(2), Supplier: i.supplier })),
  })
  const stamp = new Date().toISOString().slice(0, 10)
  const toXlsx = async () => { const { exportXlsx } = await import('../services/export'); exportXlsx(`report-${stamp}.xlsx`, Object.entries(datasets())) }
  const toPdf = async () => { const { exportPdf } = await import('../services/export'); exportPdf(`report-${stamp}.pdf`, 'Inventory report', `Generated ${new Date().toLocaleString()} · ${rows.length} transactions`, [['Monthly summary', datasets()['Monthly summary']], ['Stock snapshot', datasets()['Stock snapshot']], ['Transactions', datasets().Transactions]]) }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">Reports</h1>
        <div className="flex gap-2">
          <button className="btn btn-soft" onClick={toXlsx}>Export Excel</button>
          <button className="btn btn-primary" onClick={toPdf}>Export PDF</button>
        </div>
      </div>

      <div className="panel grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <Field label="Month"><select className="input" value={f.month} onChange={set('month')}><option value="">All</option>{months.map((m) => <option key={m} value={m}>{monthLabel(m)}</option>)}</select></Field>
        <Field label="From"><input className="input" type="date" value={f.from} onChange={set('from')} /></Field>
        <Field label="To"><input className="input" type="date" value={f.to} onChange={set('to')} /></Field>
        <Field label="Category"><select className="input" value={f.category} onChange={set('category')}><option value="">All</option>{categories.map((c) => <option key={c}>{c}</option>)}</select></Field>
        <Field label="Item"><select className="input" value={f.itemId} onChange={set('itemId')}><option value="">All</option>{items.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}</select></Field>
        <Field label="Type"><select className="input" value={f.type} onChange={set('type')}><option value="">In and out</option><option value="IN">Stock in</option><option value="OUT">Stock out</option></select></Field>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="panel"><p className="text-xs text-stone-500">Transactions</p><p className="text-xl font-bold">{rows.length}</p></div>
        <div className="panel"><p className="text-xs text-stone-500">Value in</p><p className="text-xl font-bold text-stockin">{money(tot.i)}</p></div>
        <div className="panel"><p className="text-xs text-stone-500">Value out</p><p className="text-xl font-bold text-stockout">{money(tot.o)}</p></div>
      </div>

      <section className="panel">
        <h2 className="mb-3 font-semibold">Monthly trend</h2>
        <BarChart data={monthly.map((m) => ({ label: m.label, a: m.a, b: m.b }))} />
        {monthly.length > 0 && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full">
              <thead><tr><th className="th">Month</th><th className="th text-right">Qty in</th><th className="th text-right">Qty out</th><th className="th text-right">Value in</th><th className="th text-right">Value out</th></tr></thead>
              <tbody className="divide-y divide-stone-200 dark:divide-stone-700">
                {monthly.map((m) => <tr key={m.key}><td className="td">{m.label}</td><td className="td text-right">{num(m.a)}</td><td className="td text-right">{num(m.b)}</td><td className="td text-right">{money(m.av)}</td><td className="td text-right">{money(m.bv)}</td></tr>)}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="panel !p-0">
        <h2 className="p-4 pb-2 font-semibold">Transactions ({rows.length})</h2>
        {rows.length === 0 ? <p className="p-4 pt-0 text-sm text-stone-500">No transactions match these filters.</p> : (
          <div className="max-h-96 overflow-auto">
            <table className="w-full min-w-[560px]">
              <thead className="sticky top-0 bg-white dark:bg-[#18211e]"><tr><th className="th">Date</th><th className="th">Type</th><th className="th">Item</th><th className="th text-right">Qty</th><th className="th text-right">Value</th></tr></thead>
              <tbody className="divide-y divide-stone-200 dark:divide-stone-700">
                {rows.slice(0, 300).map((t) => { const it = byId[t.itemId]; return (
                  <tr key={t.id}><td className="td whitespace-nowrap">{fmtDate(t.at)}</td><td className={`td font-semibold ${t.type === 'IN' ? 'text-stockin' : 'text-stockout'}`}>{t.type}</td><td className="td">{it.name}</td><td className="td text-right">{num(t.qty)} {it.unit}</td><td className="td text-right">{money(t.qty * it.price)}</td></tr>
                ) })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="panel !p-0">
        <h2 className="p-4 pb-2 font-semibold">Current stock ({stock.length})</h2>
        <div className="max-h-96 overflow-auto">
          <table className="w-full min-w-[480px]">
            <thead className="sticky top-0 bg-white dark:bg-[#18211e]"><tr><th className="th">Item</th><th className="th">Category</th><th className="th text-right">Quantity</th><th className="th text-right">Value</th></tr></thead>
            <tbody className="divide-y divide-stone-200 dark:divide-stone-700">
              {stock.map((i) => <tr key={i.id}><td className="td">{i.name}</td><td className="td">{i.category}</td><td className="td text-right">{num(i.quantity)} {i.unit}</td><td className="td text-right">{money(i.quantity * i.price)}</td></tr>)}
            </tbody>
          </table>
        </div>
      </section>
      <p className="text-xs text-stone-500">Values use each item's current price per unit.</p>
    </div>
  )
}
