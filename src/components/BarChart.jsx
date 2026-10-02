// Dependency-free responsive grouped bar chart (SVG).
export default function BarChart({ data, aLabel = 'Stock in', bLabel = 'Stock out' }) {
  if (!data.length) return <p className="py-8 text-center text-sm text-stone-500">No transactions yet.</p>
  const max = Math.max(1, ...data.flatMap((d) => [d.a, d.b]))
  const slot = 64, H = 150, W = data.length * slot
  return (
    <div>
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H + 22}`} style={{ minWidth: Math.min(W, 320) }} className="w-full" role="img" aria-label="Monthly stock in and out">
          {data.map((d, i) => {
            const x = i * slot + 10, bw = (slot - 20) / 2
            return (
              <g key={d.label}>
                <rect x={x} y={H - (d.a / max) * H} width={bw} height={(d.a / max) * H} rx="2" className="fill-stockin" />
                <rect x={x + bw + 2} y={H - (d.b / max) * H} width={bw} height={(d.b / max) * H} rx="2" className="fill-stockout" />
                <text x={x + bw} y={H + 15} textAnchor="middle" className="fill-stone-500 text-[10px]">{d.label}</text>
              </g>
            )
          })}
        </svg>
      </div>
      <div className="mt-2 flex gap-4 text-xs text-stone-500">
        <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-stockin" />{aLabel}</span>
        <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-stockout" />{bLabel}</span>
      </div>
    </div>
  )
}
