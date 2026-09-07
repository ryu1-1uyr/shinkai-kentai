const R = 54
const C = 2 * Math.PI * R

/**
 * 円形タイマー。ratio は 1 → 0 に減っていく残量。
 * 見た目は CSS 変数に寄せてあるので、ガワ差し替え時もここは触らなくてよい。
 */
export function CircleTimer({
  ratio,
  value,
  caption,
}: {
  ratio: number
  value: string
  caption?: string
}) {
  const r = Math.max(0, Math.min(1, ratio))
  return (
    <div className="ct">
      <svg className="ct-svg" viewBox="0 0 128 128" aria-hidden="true">
        <circle className="ct-track" cx="64" cy="64" r={R} />
        <circle
          className="ct-fill"
          cx="64"
          cy="64"
          r={R}
          strokeDasharray={C}
          strokeDashoffset={C * (1 - r)}
        />
      </svg>
      <div className="ct-center">
        <div className="ct-value">{value}</div>
        {caption && <div className="ct-caption">{caption}</div>}
      </div>
    </div>
  )
}
