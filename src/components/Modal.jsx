import { useEffect } from 'react'

export default function Modal({ title, onClose, children }) {
  useEffect(() => {
    const h = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])
  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/50 md:items-center" onMouseDown={onClose}>
      <div
        className="max-h-[92dvh] w-full overflow-y-auto rounded-t-xl bg-white p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] md:max-w-lg md:rounded-xl dark:bg-[#18211e]"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">{title}</h2>
          <button className="btn btn-soft !px-3 !py-1" onClick={onClose} aria-label="Close">✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}
