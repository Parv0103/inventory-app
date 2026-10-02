import { useEffect, useState } from 'react'
import { StoreProvider, useStore } from './hooks/useStore'
import Nav from './components/Nav'
import LockScreen from './components/LockScreen'
import Dashboard from './pages/Dashboard'
import Inventory from './pages/Inventory'
import Transactions from './pages/Transactions'
import Reports from './pages/Reports'
import Settings from './pages/Settings'

const ROUTES = { dashboard: Dashboard, inventory: Inventory, transactions: Transactions, reports: Reports, settings: Settings }

function Shell() {
  const { ready, settings } = useStore()
  const [unlocked, setUnlocked] = useState(false)
  const [page, setPage] = useState(() => location.hash.slice(1) || 'dashboard')

  useEffect(() => {
    const h = () => setPage(location.hash.slice(1) || 'dashboard')
    window.addEventListener('hashchange', h)
    return () => window.removeEventListener('hashchange', h)
  }, [])
  const go = (p) => { location.hash = p; window.scrollTo(0, 0) }

  if (!ready) return <div className="grid min-h-dvh place-items-center text-stone-500">Loading…</div>
  if (settings.pin && !unlocked) return <LockScreen onUnlock={() => setUnlocked(true)} />
  const Page = ROUTES[page] || Dashboard
  return (
    <div className="min-h-dvh md:pl-56">
      <Nav page={page} go={go} />
      <main className="mx-auto max-w-5xl p-4 pb-28 md:p-8">
        <Page go={go} />
      </main>
    </div>
  )
}

export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  )
}
