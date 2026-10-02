// Tiny IndexedDB key-value wrapper (offline-first persistence).
const open = () =>
  new Promise((resolve, reject) => {
    const req = indexedDB.open('stockroom', 1)
    req.onupgradeneeded = () => req.result.createObjectStore('kv')
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })

export async function dbGet(key) {
  try {
    const db = await open()
    return await new Promise((resolve, reject) => {
      const r = db.transaction('kv').objectStore('kv').get(key)
      r.onsuccess = () => resolve(r.result)
      r.onerror = () => reject(r.error)
    })
  } catch {
    const raw = localStorage.getItem('stockroom:' + key)
    return raw ? JSON.parse(raw) : undefined
  }
}

export async function dbSet(key, value) {
  try {
    const db = await open()
    await new Promise((resolve, reject) => {
      const tx = db.transaction('kv', 'readwrite')
      tx.objectStore('kv').put(value, key)
      tx.oncomplete = resolve
      tx.onerror = () => reject(tx.error)
    })
  } catch {
    localStorage.setItem('stockroom:' + key, JSON.stringify(value))
  }
}
