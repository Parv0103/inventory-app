import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from 'react'
import { dbGet, dbSet } from '../services/db'
import { makeMoney } from '../utils/format'

const uid = () => crypto.randomUUID()
const now = () => new Date().toISOString()

export const DEFAULTS = {
  items: [],
  txs: [],
  categories: ['General', 'Raw material', 'Finished goods', 'Packaging'],
  settings: { theme: 'light', pin: null, lowStock: 10, currency: 'USD' },
}

function reducer(s, a) {
  switch (a.type) {
    case 'load':
    case 'replace':
      return { ...DEFAULTS, ...a.data, settings: { ...DEFAULTS.settings, ...a.data.settings }, ready: true }
    case 'saveItem': {
      const i = a.item
      const exists = s.items.some((x) => x.id === i.id)
      return {
        ...s,
        items: exists
          ? s.items.map((x) => (x.id === i.id ? { ...x, ...i, quantity: x.quantity, updatedAt: now() } : x))
          : [...s.items, { ...i, quantity: 0, createdAt: now(), updatedAt: now() }],
      }
    }
    case 'deleteItem':
      return { ...s, items: s.items.filter((x) => x.id !== a.id), txs: s.txs.filter((t) => t.itemId !== a.id) }
    case 'addTx': {
      const t = a.tx
      const d = t.type === 'IN' ? t.qty : -t.qty
      return {
        ...s,
        txs: [t, ...s.txs],
        items: s.items.map((x) => (x.id === t.itemId ? { ...x, quantity: x.quantity + d, updatedAt: now() } : x)),
      }
    }
    case 'deleteTx': {
      const t = s.txs.find((x) => x.id === a.id)
      if (!t) return s
      const d = t.type === 'IN' ? -t.qty : t.qty
      return {
        ...s,
        txs: s.txs.filter((x) => x.id !== a.id),
        items: s.items.map((x) => (x.id === t.itemId ? { ...x, quantity: x.quantity + d } : x)),
      }
    }
    case 'categories':
      return { ...s, categories: a.value }
    case 'settings':
      return { ...s, settings: { ...s.settings, ...a.value } }
    default:
      return s
  }
}

const Ctx = createContext(null)
export const useStore = () => useContext(Ctx)

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, { ...DEFAULTS, ready: false })
  const ref = useRef(state)
  ref.current = state

  useEffect(() => {
    dbGet('state').then((data) => dispatch({ type: 'load', data: data || {} }))
    navigator.storage?.persist?.()
  }, [])

  useEffect(() => {
    if (!state.ready) return
    const { items, txs, categories, settings } = state
    dbSet('state', { items, txs, categories, settings })
  }, [state])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', state.settings.theme === 'dark')
  }, [state.settings.theme])

  const addTx = useCallback((d) => {
    const s = ref.current
    const item = s.items.find((x) => x.id === d.itemId)
    const qty = Number(d.qty)
    if (!item) return 'Choose an item.'
    if (!(qty > 0)) return 'Enter a quantity greater than zero.'
    if (d.type === 'OUT' && qty > item.quantity) return `Only ${item.quantity} ${item.unit} in stock.`
    const at = d.at ? new Date(d.at) : new Date()
    if (isNaN(at)) return 'Enter a valid date and time.'
    dispatch({
      type: 'addTx',
      tx: { id: uid(), itemId: d.itemId, type: d.type, qty, at: at.toISOString(), remarks: d.remarks || '', createdAt: now() },
    })
    return null
  }, [])

  const removeTx = useCallback((id) => {
    const s = ref.current
    const t = s.txs.find((x) => x.id === id)
    const item = t && s.items.find((x) => x.id === t.itemId)
    if (t && item && t.type === 'IN' && item.quantity - t.qty < 0)
      return 'Removing this stock-in would make stock negative. Remove the later stock-out first.'
    dispatch({ type: 'deleteTx', id })
    return null
  }, [])

  const saveItem = useCallback((d) => {
    if (!d.name?.trim()) return 'Enter an item name.'
    if (!(d.price >= 0)) return 'Enter a valid price.'
    const clean = {
      id: d.id || uid(),
      name: d.name.trim(),
      category: d.category || 'General',
      unit: (d.unit || 'pcs').trim(),
      price: Number(d.price) || 0,
      supplier: d.supplier?.trim() || '',
      notes: d.notes?.trim() || '',
      minStock: d.minStock === '' || d.minStock == null ? null : Number(d.minStock),
    }
    dispatch({ type: 'saveItem', item: clean })
    const opening = Number(d.quantity)
    if (!d.id && opening > 0)
      dispatch({
        type: 'addTx',
        tx: { id: uid(), itemId: clean.id, type: 'IN', qty: opening, at: now(), remarks: 'Opening stock', createdAt: now() },
      })
    return null
  }, [])

  const money = useMemo(() => makeMoney(state.settings.currency), [state.settings.currency])

  const value = useMemo(
    () => ({
      ...state,
      money,
      addTx,
      removeTx,
      saveItem,
      removeItem: (id) => dispatch({ type: 'deleteItem', id }),
      setCategories: (value) => dispatch({ type: 'categories', value }),
      setSettings: (value) => dispatch({ type: 'settings', value }),
      replaceAll: (data) => dispatch({ type: 'replace', data }),
    }),
    [state, money, addTx, removeTx, saveItem]
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
