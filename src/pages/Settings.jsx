import { useRef, useState } from 'react'
import { useStore } from '../hooks/useStore'
import Field from '../components/Field'
import { download, hashPin, parseCSV } from '../utils/format'

export default function Settings() {
  const { items, txs, categories, settings, setSettings, setCategories, saveItem, replaceAll } = useStore()
  const [newCat, setNewCat] = useState('')
  const [pin, setPin] = useState('')
  const [msg, setMsg] = useState('')
  const jsonRef = useRef(), csvRef = useRef()

  const addCat = (e) => {
    e.preventDefault()
    const c = newCat.trim()
    if (!c) return
    if (categories.some((x) => x.toLowerCase() === c.toLowerCase())) return setMsg(`"${c}" already exists.`)
    setCategories([...categories, c]); setNewCat(''); setMsg('')
  }
  const delCat = (c) => {
    if (items.some((i) => i.category === c)) return setMsg(`"${c}" is used by items. Move those items to another category first.`)
    if (categories.length === 1) return setMsg('Keep at least one category.')
    setCategories(categories.filter((x) => x !== c)); setMsg('')
  }
  const savePin = async () => {
    if (pin.length < 4) return setMsg('Use a PIN with 4 to 8 digits.')
    setSettings({ pin: await hashPin(pin) }); setPin(''); setMsg('PIN lock is on. It will ask for the PIN next time you open the app.')
  }

  const backup = () => download(`stockroom-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify({ items, txs, categories, settings: { ...settings, pin: null } }, null, 2), 'application/json')
  const restore = async (e) => {
    const file = e.target.files[0]; e.target.value = ''
    if (!file) return
    try {
      const d = JSON.parse(await file.text())
      if (!Array.isArray(d.items) || !Array.isArray(d.txs)) throw new Error()
      if (!confirm('Restore this backup? It replaces all data on this device.')) return
      replaceAll({ ...d, settings: { ...settings, ...d.settings, pin: settings.pin } })
      setMsg('Backup restored.')
    } catch { setMsg('That file is not a valid Stockroom backup.') }
  }
  const importCsv = async (e) => {
    const file = e.target.files[0]; e.target.value = ''
    if (!file) return
    const [head, ...body] = parseCSV(await file.text())
    const h = head.map((x) => x.trim().toLowerCase())
    const col = (r, k) => (r[h.indexOf(k)] ?? '').trim()
    if (h.indexOf('name') < 0) return setMsg('The CSV needs a header row with at least a "name" column.')
    const known = new Set(categories.map((c) => c.toLowerCase()))
    const extra = []
    let n = 0
    body.forEach((r) => {
      const name = col(r, 'name'); if (!name) return
      const cat = col(r, 'category') || categories[0]
      if (!known.has(cat.toLowerCase())) { known.add(cat.toLowerCase()); extra.push(cat) }
      saveItem({ name, category: cat, quantity: Number(col(r, 'quantity')) || 0, unit: col(r, 'unit') || 'pcs', price: Number(col(r, 'price')) || 0, supplier: col(r, 'supplier'), notes: col(r, 'notes'), minStock: col(r, 'minstock') })
      n++
    })
    if (extra.length) setCategories([...categories, ...extra])
    setMsg(`Imported ${n} items.`)
  }
  const sampleCsv = () => download('items-template.csv', 'name,category,quantity,unit,price,supplier,notes,minStock\nSteel rod,Raw material,120,pcs,4.5,Acme Metals,,20\n', 'text/csv')
  const reset = () => {
    if (confirm('Delete ALL items and transactions on this device? This cannot be undone.') && confirm('Really delete everything? Download a backup first if unsure.'))
      replaceAll({ settings })
  }

  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold">Settings</h1>
      {msg && <p role="status" className="panel border-forklift text-sm">{msg}</p>}

      <section className="panel space-y-3">
        <h2 className="font-semibold">Display and defaults</h2>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Theme"><select className="input" value={settings.theme} onChange={(e) => setSettings({ theme: e.target.value })}><option value="light">Light</option><option value="dark">Dark</option></select></Field>
          <Field label="Currency code"><input className="input" maxLength={3} value={settings.currency} onChange={(e) => setSettings({ currency: e.target.value.toUpperCase() })} /></Field>
          <Field label="Default low-stock level"><input className="input" type="number" min="0" inputMode="decimal" value={settings.lowStock} onChange={(e) => setSettings({ lowStock: Number(e.target.value) })} /></Field>
        </div>
      </section>

      <section className="panel space-y-3">
        <h2 className="font-semibold">Categories</h2>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <span key={c} className="inline-flex items-center gap-1 rounded-full bg-stone-200 py-1 pl-3 pr-1 text-sm dark:bg-stone-700">{c}
              <button className="grid h-6 w-6 place-items-center rounded-full hover:bg-black/10" onClick={() => delCat(c)} aria-label={`Remove ${c}`}>✕</button>
            </span>
          ))}
        </div>
        <form onSubmit={addCat} className="flex gap-2"><input className="input" placeholder="New category" value={newCat} onChange={(e) => setNewCat(e.target.value)} /><button className="btn btn-primary">Add</button></form>
      </section>

      <section className="panel space-y-3">
        <h2 className="font-semibold">PIN lock</h2>
        <p className="text-sm text-stone-500">{settings.pin ? 'PIN lock is on.' : 'Ask for a PIN each time the app opens.'}</p>
        <div className="flex gap-2">
          <input className="input" type="password" inputMode="numeric" maxLength={8} placeholder="4 to 8 digits" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} />
          <button className="btn btn-primary" onClick={savePin}>{settings.pin ? 'Change PIN' : 'Set PIN'}</button>
          {settings.pin && <button className="btn btn-soft" onClick={() => { setSettings({ pin: null }); setMsg('PIN lock is off.') }}>Turn off</button>}
        </div>
      </section>

      <section className="panel space-y-3">
        <h2 className="font-semibold">Data</h2>
        <div className="flex flex-wrap gap-2">
          <button className="btn btn-soft" onClick={backup}>Download backup</button>
          <button className="btn btn-soft" onClick={() => jsonRef.current.click()}>Restore backup</button>
          <button className="btn btn-soft" onClick={() => csvRef.current.click()}>Import items from CSV</button>
          <button className="btn btn-soft" onClick={sampleCsv}>CSV template</button>
        </div>
        <input ref={jsonRef} type="file" accept="application/json,.json" hidden onChange={restore} />
        <input ref={csvRef} type="file" accept=".csv,text/csv" hidden onChange={importCsv} />
        <button className="btn btn-danger" onClick={reset}>Delete all data</button>
      </section>
    </div>
  )
}
