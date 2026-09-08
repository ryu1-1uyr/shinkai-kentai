import { maskOf, powerAt, rateAt } from '../../game/mutations.ts'
import { chooseDraft, getConfig, reroll } from '../../store/gameStore.ts'
import { fmt } from '../format.ts'
import { useGame } from '../useGame.ts'
import { SharkIcon } from './SharkIcon.tsx'
import { Sprite } from './Sprite.tsx'

const RARITY_LABEL: Record<string, string> = {
  common: 'COMMON',
  uncommon: 'UNCOMMON',
  rare: 'RARE',
  legendary: 'LEGENDARY',
}

/**
 * ドラフト。突然変異（検体側）と研究方針（施設側）の 2 種類が同じ枠に出る。
 * 見分けが付かないと「またカードか」になるため、見出し・色・添える絵で峻別する。
 */
export function DraftOverlay() {
  const s = useGame()
  const cfg = getConfig()
  const d = s.pendingDraft
  if (!d) return null

  const isPolicy = d.kind === 'policy'

  return (
    <div className="overlay">
      <div className="modal" data-draft={d.kind}>
        <div>
          <div className="modal-title">{isPolicy ? '研究方針を決定' : '突然変異を確認'}</div>
          <div className="modal-sub">
            {isPolicy
              ? `培養液を累計 ${fmt(s.cultureTotal)} 採取。実験の進め方を選ぶ（施設に作用する）`
              : `累計 ${fmt(s.producedTotal)} 体を生産。以降に生まれる検体にのみ発現する（在庫の個体は変異しない）`}
          </div>
        </div>

        {s.rerollsLeft > 0 && (
          <button className="reroll" onClick={reroll}>
            ↻ 引き直す（残り {s.rerollsLeft} 回）
          </button>
        )}

        <div className="cards">
          {d.kind === 'mutation'
            ? d.offers.map((m, i) => {
                const cur = s.ranks.get(m.id) ?? 0
                const next = cur + 1
                return (
                  <button
                    key={m.id}
                    className="card"
                    data-rarity={m.rarity}
                    onClick={() => chooseDraft(i)}
                  >
                    <SharkIcon mask={maskOf(m)} height={40} />
                    <span className="card-rarity">{RARITY_LABEL[m.rarity]}</span>
                    <span className="card-name">{m.name}</span>
                    {s.meta.showNumbers ? (
                      <span className="card-effect">
                        発現率 {(rateAt(m, next, cfg) * 100).toFixed(0)}% ／ 戦闘力 ×
                        {fmt(powerAt(m, next, cfg))}
                      </span>
                    ) : (
                      <span className="card-effect" data-unknown="true">
                        未解析 — 希少度だけが手がかり
                      </span>
                    )}
                    {cur > 0 && (
                      <span className="card-upgrade">
                        R{cur} → R{next} に強化（発現率も倍率も上がる）
                      </span>
                    )}
                  </button>
                )
              })
            : d.offers.map((p, i) => {
                const cur = s.policies.get(p.id) ?? 0
                const next = cur + 1
                return (
                  <button key={p.id} className="card" data-kind="policy" onClick={() => chooseDraft(i)}>
                    <Sprite kind="policy" id={p.id} size={40} />
                    <span className="card-rarity">POLICY</span>
                    <span className="card-name">{p.name}</span>
                    <span className="card-effect">{p.detail(next)}</span>
                    {cur > 0 && (
                      <span className="card-upgrade">
                        R{cur} → R{next} に強化（上限 R{p.maxRank}）
                      </span>
                    )}
                  </button>
                )
              })}
        </div>
      </div>
    </div>
  )
}
