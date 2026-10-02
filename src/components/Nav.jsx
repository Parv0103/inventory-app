export const PAGES = [
  ['dashboard', 'Dashboard', '▦'],
  ['inventory', 'Inventory', '▤'],
  ['transactions', 'Transactions', '⇄'],
  ['reports', 'Reports', '◔'],
  ['settings', 'Settings', '⚙'],
]

export default function Nav({ page, go }) {
  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-56 flex-col border-r border-stone-300 bg-white p-3 md:flex dark:border-stone-700 dark:bg-[#18211e]">
        <div className="mb-4 flex items-center gap-2 px-2 py-3 text-lg font-bold">
          <span className="grid h-8 w-8 place-items-center rounded bg-forklift text-ink">▣</span>Stockroom
        </div>
        {PAGES.map(([id, label, icon]) => (
          <button
            key={id}
            onClick={() => go(id)}
            className={`mb-1 flex items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm font-medium transition ${
              page === id ? 'bg-forklift text-ink' : 'hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            <span className="w-4 text-center">{icon}</span>
            {label}
          </button>
        ))}
      </aside>
      <nav className="fixed inset-x-0 bottom-0 z-20 flex border-t border-stone-300 bg-white pb-[env(safe-area-inset-bottom)] md:hidden dark:border-stone-700 dark:bg-[#18211e]">
        {PAGES.map(([id, label, icon]) => (
          <button
            key={id}
            onClick={() => go(id)}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${
              page === id ? 'text-ink dark:text-forklift' : 'text-stone-500'
            }`}
          >
            <span className={`rounded-full px-4 py-0.5 text-base ${page === id ? 'bg-forklift text-ink' : ''}`}>{icon}</span>
            {label}
          </button>
        ))}
      </nav>
    </>
  )
}
