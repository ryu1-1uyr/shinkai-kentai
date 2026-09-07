import {
  NUMERIC_UPGRADES,
  UNLOCKS,
  unlockAvailable,
  upgradeCost,
} from '../../game/meta.ts'
import {
  getMeta,
  purchaseNumeric,
  purchaseUnlock,
  startNewRun,
} from '../../store/gameStore.ts'
import { fmt } from '../format.ts'
import { useGame } from '../useGame.ts'
import { Sprite } from './Sprite.tsx'

export function LabScreen() {
  useGame()
  const meta = getMeta()

  const visibleUnlocks = UNLOCKS.filter(
    (u) => meta.unlocked.includes(u.id) || unlockAvailable(meta, u),
  )

  return (
    <div className="lab">
      <div className="lab-head">
        <div>
          <div className="panel-title">研究所</div>
          <div className="lab-budget">
            <span className="lab-budget-value">{fmt(meta.budget)}</span>
            <span className="stat-label">研究予算</span>
          </div>
        </div>
        <div className="lab-stats">
          <span>実験回数 {meta.runs}</span>
          <span>最高突破深度 {meta.bestDepth}</span>
          <span>累計予算 {fmt(meta.lifetimeBudget)}</span>
        </div>
        <button className="btn" onClick={startNewRun}>
          次の実験を開始する
        </button>
      </div>

      <div className="lab-cols">
        <div className="panel">
          <div className="panel-title">系統の解禁 — ドラフトに出る変異が増える</div>
          {visibleUnlocks
            .filter((u) => u.kind === 'family')
            .map((u) => {
              const owned = meta.unlocked.includes(u.id)
              return (
                <button
                  key={u.id}
                  className="up"
                  data-owned={owned}
                  disabled={owned || meta.budget < u.cost}
                  onClick={() => purchaseUnlock(u.id)}
                >
                  <span className="up-name">
                    {u.name}
                    <span className="up-detail">{u.detail}</span>
                  </span>
                  <span className="up-cost">{owned ? '解禁済み' : fmt(u.cost)}</span>
                </button>
              )
            })}

          <div className="panel-title" style={{ marginTop: 'var(--sp-3)' }}>
            特殊装備 — 買い切りで挙動が変わる
          </div>
          {visibleUnlocks
            .filter((u) => u.kind === 'unique')
            .map((u) => {
              const owned = meta.unlocked.includes(u.id)
              return (
                <button
                  key={u.id}
                  className="up"
                  data-owned={owned}
                  disabled={owned || meta.budget < u.cost}
                  onClick={() => purchaseUnlock(u.id)}
                >
                  <span className="up-name">
                    {u.name}
                    <span className="up-detail">{u.detail}</span>
                  </span>
                  <span className="up-cost">{owned ? '装備済み' : fmt(u.cost)}</span>
                </button>
              )
            })}

          <div className="panel-title" style={{ marginTop: 'var(--sp-3)' }}>
            利便性
          </div>
          {visibleUnlocks
            .filter((u) => u.kind === 'qol')
            .map((u) => {
              const owned = meta.unlocked.includes(u.id)
              return (
                <button
                  key={u.id}
                  className="up"
                  data-owned={owned}
                  disabled={owned || meta.budget < u.cost}
                  onClick={() => purchaseUnlock(u.id)}
                >
                  <span className="up-name">
                    {u.name}
                    <span className="up-detail">{u.detail}</span>
                  </span>
                  <span className="up-cost">{owned ? '取得済み' : fmt(u.cost)}</span>
                </button>
              )
            })}
        </div>

        <div className="panel">
          <div className="panel-title">数値強化</div>
          {NUMERIC_UPGRADES.map((u) => {
            const lv = meta.levels[u.id] ?? 0
            const maxed = lv >= u.maxLevel
            const cost = upgradeCost(u, lv)
            return (
              <button
                key={u.id}
                className="up"
                disabled={maxed || meta.budget < cost}
                onClick={() => purchaseNumeric(u.id)}
              >
                <span className="up-name">
                  {u.name} <span className="up-level">Lv.{lv}</span>
                  <span className="up-detail">{u.detail(lv + (maxed ? 0 : 1))}</span>
                </span>
                <span className="up-cost">{maxed ? 'MAX' : fmt(cost)}</span>
              </button>
            )
          })}
        </div>
      </div>

      <p className="empty-note">
        <Sprite kind="resource" id="shark" /> 生産量が伸びるほどレアな変異が提示されやすくなる。
        生産系の強化は、そのままレアカードへのアクセスにもなる。
      </p>
    </div>
  )
}
