import { useRef } from 'react'
import { BUILDINGS, costOf } from '../../game/buildings.ts'
import { totalSharks } from '../../game/inventory.ts'
import { clickValue, critChance, critMult, cultureRate, launchRate, sharkRate } from '../../game/tick.ts'
import {
  buy,
  getAutoBuyMode,
  getAutoBuyTarget,
  getConfig,
  manualClick,
  setAutoBuyTarget,
} from '../../store/gameStore.ts'
import { fmt } from '../format.ts'
import { useGame } from '../useGame.ts'
import { DraftGauges } from './DraftGauges.tsx'
import { Sprite } from './Sprite.tsx'

function effectText(id: string, cfg: ReturnType<typeof getConfig>): string {
  switch (id) {
    case 'tank':
      return `培養液 +1.0/s・クリック +${cfg.click.perTankBonus}`
    case 'feeder':
      return '培養液 +10/s'
    case 'breeder':
      return `サメ +0.8/s（培養液 ${cfg.shark.cultureCost}/体）`
    case 'accelerator':
      return 'サメ生産 +20%'
    case 'launcher':
      return '投入速度 +15/s'
    default:
      return ''
  }
}

export function ProducePanel() {
  const s = useGame()
  const cfg = getConfig()
  const areaRef = useRef<HTMLButtonElement>(null)

  /**
   * クリックの手応え。
   * インクリメンタルは同じ操作を何百回も繰り返すジャンルなので、
   * 1 回ごとに反応が返らないと手が止まる。
   * React の再描画には乗せず、DOM を直接生やして CSS で消す。
   */
  const onCollect = (e: React.MouseEvent<HTMLButtonElement>) => {
    const { gained, crit } = manualClick()
    const host = areaRef.current
    if (!host) return
    const r = host.getBoundingClientRect()
    const pop = document.createElement('span')
    pop.className = 'pop'
    if (crit) pop.dataset.crit = 'true'
    pop.textContent = `+${fmt(gained)}`
    pop.style.setProperty('--px', `${e.clientX - r.left}px`)
    pop.style.setProperty('--py', `${e.clientY - r.top}px`)
    pop.style.setProperty('--drift', `${(Math.random() - 0.5) * 40}px`)
    pop.addEventListener('animationend', () => pop.remove(), { once: true })
    host.appendChild(pop)
    host.classList.remove('is-hit')
    // 連打しても毎回アニメーションが走るよう、一度リセットしてから付け直す
    void host.offsetWidth
    host.classList.add('is-hit')
  }

  const crit = critChance(s)

  return (
    <div className="col area-produce">
      <button className="click-area" ref={areaRef} onClick={onCollect}>
        <Sprite kind="resource" id="culture" size={48} />
        <span className="click-label">培養液を採取</span>
        <span className="click-hint">+{fmt(clickValue(s, cfg))} / クリック</span>
        {crit > 0 && (
          <span className="click-crit">
            会心 {Math.round(crit * 100)}% ×{critMult(s).toFixed(1)}
          </span>
        )}
      </button>

      <div className="panel">
        <div className="panel-title">資源</div>
        <div className="stat" data-kind="culture">
          <Sprite kind="resource" id="culture" />
          <span className="stat-label">培養液</span>
          <span className="stat-value">{fmt(s.culture)}</span>
          <span className="stat-rate">+{fmt(cultureRate(s))}/s</span>
        </div>
        <div className="stat" data-kind="shark">
          <Sprite kind="resource" id="shark" />
          <span className="stat-label">検体</span>
          <span className="stat-value">{fmt(totalSharks(s.inv))}</span>
          <span className="stat-rate">+{fmt(sharkRate(s))}/s</span>
        </div>
        <DraftGauges s={s} />

        <div className="tally">
          <span className="stat-label">累計生産</span>
          <span className="tally-value">{fmt(s.producedTotal)}</span>
          <span className="tally-unit">体</span>
          <span className="tally-species">{s.births.size} 種</span>
        </div>
        <div className="stat" data-kind="score">
          <Sprite kind="resource" id="score" />
          <span className="stat-label">戦果</span>
          <span className="stat-value">{fmt(s.score)}</span>
          <span className="stat-rate">投入 {fmt(launchRate(s, cfg))}/s</span>
        </div>
      </div>

      <div className="panel scroll">
        <div className="panel-title">設備</div>
        {BUILDINGS.map((b, i) => {
          const cost = costOf(b, s.buildings[i])
          const auto = getAutoBuyTarget() === i
          return (
            <div key={b.id} className="buy-row">
              <button
                className="buy"
                data-afford={s.culture >= cost}
                disabled={s.culture < cost}
                onClick={() => buy(i)}
              >
                <Sprite kind="building" id={b.id} />
                <span className="buy-name">
                  {b.name}
                  <span className="buy-effect">{effectText(b.id, cfg)}</span>
                </span>
                <span className="buy-right">
                  <span className="buy-cost">{fmt(cost)}</span>
                  <span className="buy-owned">所持 {s.buildings[i]}</span>
                </span>
              </button>
              {s.meta.autoBuyOne && (
                <button
                  className="buy-auto"
                  data-on={auto}
                  data-idle={getAutoBuyMode() !== 'one'}
                  title="定期発注の対象にする"
                  aria-label={`${b.name}を定期発注する`}
                  onClick={() => setAutoBuyTarget(i)}
                >
                  {auto ? '☑' : '☐'}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
