import { MUTATIONS, nameOfMask, powerOfMask, rateAt } from '../../game/mutations.ts'
import { getConfig } from '../../store/gameStore.ts'
import { fmt } from '../format.ts'
import { useGame } from '../useGame.ts'
import { SharkIcon } from './SharkIcon.tsx'
import { Sprite } from './Sprite.tsx'

const VISIBLE = 10

export function StockPanel() {
  const s = useGame()
  const cfg = getConfig()

  /*
   * 在庫ではなく「このランで生まれた種」を並べる。
   * 侵略中は生産した端から出撃するので在庫は常にほぼゼロで、
   * 在庫だけを出すと一覧が空になって何を作ってきたのかが残らない。
   * 出撃済みの種は 0 体のまま並べ続け、そのランの成果として見せる。
   */
  const stacks = [...s.births.entries()]
    .filter(([, born]) => born >= 1)
    .map(([mask]) => ({ mask, count: s.inv.get(mask) ?? 0, power: powerOfMask(mask, s.ranks, cfg) }))
    // 在庫のある種を先に、そのあとは戦闘力の高い順
    .sort((a, b) => Number(b.count >= 1) - Number(a.count >= 1) || b.power - a.power)
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
                    R{rank}
                    {s.meta.showNumbers && ` ${(rateAt(m, rank, cfg) * 100).toFixed(0)}%`}
                  </span>
                </span>
              )
            })}
          </div>
        )}
      </div>

      <div className="panel scroll">
        <div className="panel-title">検体在庫</div>
        {s.phase === 'invasion' && (
          <p className="panel-note">生産した端から出撃していくため、在庫はほぼゼロで推移する。</p>
        )}
        {shown.length === 0 ? (
          <p className="empty-note">まだ検体がいない。培養液を集めて生産を始める。</p>
        ) : (
          shown.map((st) => (
            <div key={st.mask} className="stack" data-empty={st.count < 1}>
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
