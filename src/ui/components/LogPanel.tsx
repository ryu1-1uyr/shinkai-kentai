import type { GameState } from '../../game/state.ts'
import { mmss } from '../format.ts'

/**
 * 観測記録。培養フェーズと侵略フェーズの両方で使う。
 * 培養中は戦闘が起きないぶん、新種の誕生とドラフトの記録が主役になる。
 */
export function LogPanel({
  s,
  title,
  limit = 16,
  empty,
}: {
  s: GameState
  title: string
  limit?: number
  empty: string
}) {
  return (
    <div className="panel scroll">
      <div className="panel-title">{title}</div>
      {s.log.length === 0 ? (
        <p className="idle-note">{empty}</p>
      ) : (
        <ol className="log">
          {s.log.slice(0, limit).map((e, i) => (
            <li key={`${e.t}-${i}`} className="log-row" data-kind={e.kind}>
              <span className="log-time">{mmss(e.t)}</span>
              <span className="log-text">{e.text}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
