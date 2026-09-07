import { powerAt, rateAt } from '../../game/mutations.ts'
import { chooseDraft, getConfig, reroll } from '../../store/gameStore.ts'
import { fmt } from '../format.ts'
import { useGame } from '../useGame.ts'
import { Sprite } from './Sprite.tsx'

const RARITY_LABEL: Record<string, string> = {
  common: 'COMMON',
  uncommon: 'UNCOMMON',
  rare: 'RARE',
  legendary: 'LEGENDARY',
}

export function DraftOverlay() {
  const s = useGame()
  const cfg = getConfig()
  const offers = s.pendingOffers
  if (!offers) return null

  return (
    <div className="overlay">
      <div className="modal">
        <div>
          <div className="modal-title">突然変異を確認</div>
          <div className="modal-sub">
            累計 {fmt(s.producedTotal)} 体を生産。
            以降に生まれる検体にのみ発現する（在庫の個体は変異しない）
          </div>
        </div>

        {s.rerollsLeft > 0 && (
          <button className="reroll" onClick={reroll}>
            ↻ 引き直す（残り {s.rerollsLeft} 回）
          </button>
        )}

        <div className="cards">
          {offers.map((m, i) => {
            const cur = s.ranks.get(m.id) ?? 0
            const next = cur + 1
            return (
              <button key={m.id} className="card" data-rarity={m.rarity} onClick={() => chooseDraft(i)}>
                <Sprite kind="mutation" id={m.id} />
                <span className="card-rarity">{RARITY_LABEL[m.rarity]}</span>
                <span className="card-name">{m.name}</span>
                <span className="card-effect">
                  発現率 {(rateAt(m, next, cfg) * 100).toFixed(0)}% ／ 戦闘力 ×
                  {fmt(powerAt(m, next, cfg))}
                </span>
                {cur > 0 && (
                  <span className="card-upgrade">
                    R{cur} → R{next} に強化（発現率も倍率も上がる）
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
