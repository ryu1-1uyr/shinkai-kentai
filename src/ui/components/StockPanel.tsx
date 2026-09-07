import { sortedByPower } from '../../game/inventory.ts'
import { MUTATIONS, nameOfMask, rateAt } from '../../game/mutations.ts'
import { getConfig } from '../../store/gameStore.ts'
import { fmt } from '../format.ts'
import { useGame } from '../useGame.ts'
import { SharkIcon } from './SharkIcon.tsx'
import { Sprite } from './Sprite.tsx'

const VISIBLE = 10

export function StockPanel() {
  const s = useGame()
  const cfg = getConfig()

  const stacks = sortedByPower(s.inv, s.ranks, cfg)
    .filter((x) => x.count >= 1)
    .sort((a, b) => b.power * b.count - a.power * a.count)
  const shown = stacks.slice(0, VISIBLE)
  const rest = stacks.slice(VISIBLE)
  const restCount = rest.reduce((a, b) => a + b.count, 0)

  return (
    <div className="col area-stock">
      <div className="panel">
        <div className="panel-title">保有している突然変異</div>
        {s.ranks.size === 0 ? (
          <p className="empty-note">まだ変異は発現していない。検体を生産すると実験機会が訪れる。</p>
        ) : (
          <div className="mut-list">
            {MUTATIONS.filter((m) => (s.ranks.get(m.id) ?? 0) > 0).map((m) => {
              const rank = s.ranks.get(m.id)!
              return (
                <span key={m.id} className="mut" data-rarity={m.rarity}>
                  <Sprite kind="mutation" id={m.id} size={18} />
                  {m.name}
                  <span className="mut-rank">
                    R{rank} {(rateAt(m, rank, cfg) * 100).toFixed(0)}%
                  </span>
                </span>
              )
            })}
          </div>
        )}
      </div>

      <div className="panel scroll">
        <div className="panel-title">検体在庫</div>
        {shown.length === 0 ? (
          <p className="empty-note">
            在庫なし。侵略中は生産した端から出撃していくため、在庫はほぼゼロで推移する。
          </p>
        ) : (
          shown.map((st) => (
            <div key={st.mask} className="stack">
              <SharkIcon mask={st.mask} height={26} />
              <span className="stack-name">{nameOfMask(st.mask)}</span>
              <span className="stack-count">{fmt(st.count)}</span>
              <span className="stack-power">{fmt(st.power)}</span>
            </div>
          ))
        )}
        {rest.length > 0 && (
          <div className="stack">
            <span className="stack-name empty-note">その他 {rest.length} 種</span>
            <span className="stack-count">{fmt(restCount)}</span>
          </div>
        )}
      </div>
    </div>
  )
}
