import { bossHp, depthName, targetCount, targetHp } from '../../game/targets.ts'
import { getConfig } from '../../store/gameStore.ts'
import { fmt } from '../format.ts'
import { useGame } from '../useGame.ts'
import { CircleTimer } from './CircleTimer.tsx'
import { InvasionViewer } from './InvasionViewer.tsx'
import { Sprite } from './Sprite.tsx'

export function InvasionPanel() {
  const s = useGame()
  const cfg = getConfig()

  if (s.phase === 'culture') {
    const left = Math.max(0, cfg.culturePhaseSec - s.t)
    return (
      <div className="col area-invasion">
        <div className="panel">
          <div className="panel-title">培養フェーズ</div>
          <CircleTimer
            ratio={left / cfg.culturePhaseSec}
            value={Math.ceil(left).toString()}
            caption="侵略開始まで"
          />
          <p className="idle-note">
            検体は投入するまで失われない。いま生産した分はそのまま戦力になる。
            <br />
            侵略が始まっても生産は続けられるため、手を止める必要はない。
          </p>
        </div>
      </div>
    )
  }

  const name = depthName(s.depth)
  const max = s.onBoss ? bossHp(s.depth, cfg) : targetHp(s.depth, cfg)
  const pct = Math.max(0, Math.min(100, (s.currentHp / max) * 100))
  const total = targetCount(s.depth, cfg)

  return (
    <div className="col area-invasion">
      <div className="panel">
        <div className="panel-title">{name.zone}</div>
        <div className="target">
          <div className="target-head">
            <Sprite kind="target" id={s.onBoss ? 'boss' : 'normal'} />
            <span className="target-name" data-boss={s.onBoss}>
              {s.onBoss ? name.boss : name.normal}
            </span>
            <span className="target-hp">
              {fmt(s.currentHp)} / {fmt(max)}
            </span>
          </div>
          <div className="bar">
            <div className="bar-fill" data-boss={s.onBoss} style={{ width: `${pct}%` }} />
          </div>
        </div>

        <InvasionViewer />

        <div className="progress-dots">
          {Array.from({ length: total }, (_, i) => (
            <span key={i} className="dot" data-done={i < s.destroyed} />
          ))}
          <span className="dot" data-boss="true" data-done={s.onBoss} />
        </div>

        <div className="launch-info">
          <span>破壊 {s.destroyed} / {total}</span>
          <span>突破深度 {s.clearedDepth}</span>
        </div>
      </div>

      <div className="panel">
        <div className="panel-title">交戦記録</div>
        <p className="idle-note">
          検体は戦闘力の低い個体から自動で出撃する。投入された個体は必ず失われる。
          <br />
          深度を突破するたびに残り時間が +{cfg.invasion.runWideBonusPerDepth} 秒される。
        </p>
      </div>
    </div>
  )
}
