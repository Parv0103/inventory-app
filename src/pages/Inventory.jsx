import { useMemo, useState } from 'react'
import { useStore } from '../hooks/useStore'
import Modal from '../components/Modal'
import Field from '../components/Field'
import { isLow, num } from '../utils/format'

const UNITS = ['pcs', 'kg', 'g', 'liters', 'ml', 'meters', 'boxes', 'bags']
const blank = (cat) => ({ name: '', category: cat, quantity: '', unit: 'pcs', price: '', supplier: '', notes: '', minStock: '' })

function ItemForm({ initial, onClose }) {
  const { categories, saveItem, settings } = useStore()
  const [f, setF] = useState(initial)
  const [err, setErr] = useState('')
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const editing = !!f.id
  const submit = (e) => {
    e.preventDefault()
    const r = saveItem({ ...f, price: f.price === '' ? 0 : Number(f.price) })
    r ? setErr(r) : onClose()
  }
  return (
    <Modal title={editing ? 'Edit item' : 'Add item'} onClose={onClose}>
      <form onSubmit={submit} className="grid grid-cols-2 gap-3">
        <Field label="Item name" className="col-span-2"><input className="input" autoFocus value={f.name} onChange={set('name')} required /></Field>
        <Field label="Category">
          <select className="input" value={f.category} onChange={set('category')}>{categories.map((c) => <option key={c}>{c}</option>)}</select>
        </Field>
        <Field label="Unit">
          <input className="input" list="units" value={f.unit} onChange={set('unit')} />
          <datalist id="units">{UNITS.map((u) => <option key={u} value={u} />)}</datalist>
        </Field>
        {editing ? (
          <p className="col-span-2 rounded-md bg-stone-100 p-2 text-xs text-stone-600 dark:bg-stone-800 dark:text-stone-300">
            Current stock: {num(f.quantity)} {f.unit}. Change it with Stock in or Stock out on the Transactions page.
          </p>
        ) : (
          <Field label="Opening quantity"><input className="input" type="number" min="0" step="any" inputMode="decimal" value={f.quantity} onChange={set('quantity')} /></Field>
        )}
        <Field label="Price per unit"><input className="input" type="number" min="0" step="any" inputMode="decimal" value={f.price} onChange={set('price')} /></Field>
        <Field label={`Low-stock level (default ${settings.lowStock})`}><input className="input" type="number" min="0" step="any" inputMode="decimal" value={f.minStock ?? ''} onChange={set('minStock')} /></Field>
        <Field label="Supplier (optional)"><input className="input" value={f.supplier} onChange={set('supplier')} /></Field>
        <Field label="Notes" className="col-span-2"><textarea className="input" rows="2" value={f.notes} onChange={set('notes')} /></Field>
        {err && <p className="col-span-2 text-sm text-stockout">{err}</p>}
        <button className="btn btn-primary col-span-2">Save item</button>
      </form>
    </Modal>
  )
}

export default function Inventory() {
  const { items, categories, settings, money, removeItem } = useStore()
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('')
  const [lowOnly, setLowOnly] = useState(false)
  const [edit, setEdit] = useState(null)

  const list = useMemo(() => {
    const s = q.toLowerCase()
    return items
      .filter((i) => (!cat || i.category === cat) && (!lowOnly || isLow(i, settings)) && `${i.name} ${i.supplier} ${i.notes}`.toLowerCase().includes(s))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [items, q, cat, lowOnly, settings])

  const del = (i) => confirm(`Delete "${i.name}" and its transaction history?`) && removeItem(i.id)
  const Actions = ({ i }) => (
    <div className="flex gap-2">
      <button className="btn btn-soft !px-3 !py-1.5" onClick={() => setEdit(i)}>Edit</button>
      <button className="btn btn-soft !px-3 !py-1.5 text-stockout" onClick={() => del(i)}>Delete</button>
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Inventory</h1>
        <button className="btn btn-primary" onClick={() => setEdit(blank(categories[0]))}>Add item</button>
      </div>
      <div className="flex flex-wrap gap-2">
        <input className="input min-w-0 flex-1 basis-48" type="search" placeholder="Search name, supplier, notes" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="input w-auto" value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Category">
          <option value="">All categories</option>
          {categories.map((c) => <option key={c}>{c}</option>)}
        </select>
        <button className={`btn ${lowOnly ? 'btn-primary' : 'btn-soft'}`} onClick={() => setLowOnly(!lowOnly)}>Low stock</button>
      </div>

      {list.length === 0 ? (
        <p className="panel text-center text-sm text-stone-500">{items.length ? 'No items match these filters.' : 'No items yet. Add your first item to begin.'}</p>
      ) : (
        <>
          <div className="grid gap-3 md:hidden">
            {list.map((i) => (
              <div key={i.id} className="panel">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{i.name}</p>
                    <p className="text-xs text-stone-500">{i.category}{i.supplier && ` · ${i.supplier}`}</p>
                  </div>
                  <p className={`shrink-0 text-lg font-bold ${isLow(i, settings) ? 'text-lowstock' : ''}`}>{num(i.quantity)} <span className="text-xs font-normal">{i.unit}</span></p>
                </div>
                <p className="mt-1 text-sm text-stone-500">{money(i.price)} per {i.unit} · Value {money(i.quantity * i.price)}</p>
                {i.notes && <p className="mt-1 text-xs text-stone-500">{i.notes}</p>}
                <div className="mt-3 flex items-center justify-between">
                  {isLow(i, settings) ? <span className="text-xs font-semibold text-lowstock">Low stock</span> : <span />}
                  <Actions i={i} />
                </div>
              </div>
            ))}
          </div>
          <div className="panel hidden overflow-x-auto !p-0 md:block">
            <table className="w-full">
              <thead className="border-b border-stone-200 dark:border-stone-700">
                <tr><th className="th">Item</th><th className="th">Category</th><th className="th text-right">Quantity</th><th className="th text-right">Price</th><th className="th text-right">Value</th><th className="th">Supplier</th><th className="th" /></tr>
              </thead>
              <tbody className="divide-y divide-stone-200 dark:divide-stone-700">
                {list.map((i) => (
                  <tr key={i.id}>
                    <td className="td font-medium">{i.name}{i.notes && <p className="text-xs font-normal text-stone-500">{i.notes}</p>}</td>
                    <td className="td">{i.category}</td>
                    <td className={`td text-right ${isLow(i, settings) ? 'font-semibold text-lowstock' : ''}`}>{num(i.quantity)} {i.unit}</td>
                    <td className="td text-right">{money(i.price)}</td>
                    <td className="td text-right">{money(i.quantity * i.price)}</td>
                    <td className="td">{i.supplier}</td>
                    <td className="td"><Actions i={i} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      {edit && <ItemForm initial={edit} onClose={() => setEdit(null)} />}
    </div>
  )
}
