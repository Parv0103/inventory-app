const p = (n) => String(n).padStart(2, '0')

export const toLocalInput = (d = new Date()) =>
  `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`

export const monthKey = (iso) => {
  const d = new Date(iso)
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}`
}

export const monthLabel = (key) => {
  const [y, m] = key.split('-')
  return new Date(+y, +m - 1, 1).toLocaleDateString([], { month: 'short', year: '2-digit' })
}

export const fmtDate = (iso) => new Date(iso).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })

export const makeMoney = (currency = 'USD') => {
  let f
  try {
    f = new Intl.NumberFormat(undefined, { style: 'currency', currency })
  } catch {
    f = new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' })
  }
  return (n) => f.format(n || 0)
}

export const num = (n) => new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(n || 0)

export const minOf = (item, settings) =>
  item.minStock != null && item.minStock !== '' ? Number(item.minStock) : Number(settings.lowStock)

export const isLow = (item, settings) => item.quantity <= minOf(item, settings)

export function parseCSV(text) {
  const rows = []
  let r = [], c = '', q = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (q) {
      if (ch === '"') {
        if (text[i + 1] === '"') { c += '"'; i++ } else q = false
      } else c += ch
    } else if (ch === '"') q = true
    else if (ch === ',') { r.push(c); c = '' }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++
      r.push(c); c = ''; rows.push(r); r = []
    } else c += ch
  }
  if (c || r.length) { r.push(c); rows.push(r) }
  return rows.filter((x) => x.some((v) => v.trim()))
}

export function download(name, content, type) {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const a = Object.assign(document.createElement('a'), { href: url, download: name })
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export async function hashPin(pin) {
  try {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('stockroom:' + pin))
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
  } catch {
    return 'plain:' + pin
  }
}
