import type { GameState } from '../../game/state.ts'
import { fmt } from '../format.ts'

/**
 * 次のカードまでの進捗。
 *
 * 突然変異は検体の累計生産数、研究方針は培養液の累計獲得量で進む。
 * 引き金となる資源が違うので、2 本並べると
 * 「いまどちらに近いか」「何を稼げば次が来るか」が読める。
 */
export function DraftGauges({ s }: { s: GameState }) {
  const rows = [
    {
      key: 'mutation',
      label: '突然変異',
      unit: '体',
      have: s.producedTotal,
      need: s.nextDraftAt,
    },
    {
      key: 'policy',
      label: '研究方針',
      unit: '',
      have: s.cultureTotal,
      need: s.nextPolicyAt,
    },
  ]

  return (
    <div className="gauges">
      {rows.map((r) => {
        const pct = Math.min(100, (r.have / Math.max(1, r.need)) * 100)
        const left = Math.max(0, r.need - r.have)
        return (
          <div key={r.key} className="gauge-row" data-kind={r.key}>
            <span className="gauge-label">{r.label}</span>
            <div className="gauge">
              <div className="gauge-fill" style={{ width: `${pct}%` }} />
            </div>
            <span className="gauge-left">{isFinite(left) ? `あと ${fmt(left)}${r.unit}` : '打ち止め'}</span>
          </div>
        )
      })}
    </div>
  )
}
