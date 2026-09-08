import { bossHp, depthName, targetCount, targetHp } from '../../game/targets.ts'
import { getConfig } from '../../store/gameStore.ts'
import { fmt } from '../format.ts'
import { useGame } from '../useGame.ts'
import { CircleTimer } from './CircleTimer.tsx'
import { LogPanel } from './LogPanel.tsx'
import { InvasionViewer } from './InvasionViewer.tsx'
import { Sprite } from './Sprite.tsx'

export function InvasionPanel() {
  const s = useGame()
  const cfg = getConfig()

  if (s.phase === 'culture') {
    const left = Math.max(0, cfg.culturePhaseSec - s.t)
    return (
      <div className="col area-invasion">
        <div className="panel is-primary">
          <div className="panel-title">培養フェーズ</div>
          <CircleTimer
            ratio={left / cfg.culturePhaseSec}
            value={Math.ceil(left).toString()}
            caption="侵略開始まで"
          />
          <p className="idle-note">
            検体は投入するまで失われない。いま生産した分はそのまま戦力になる。
          </p>
        </div>

        <LogPanel
          s={s}
          title="観測記録"
          empty="まだ記録がない。検体を生産すると実験機会が訪れる。"
        />
      </div>
    )
  }

  const name = depthName(s.depth)
  const max = s.onBoss ? bossHp(s.depth, cfg) : targetHp(s.depth, cfg)
  const pct = Math.max(0, Math.min(100, (s.currentHp / max) * 100))
  const total = targetCount(s.depth, cfg)

  return (
    <div className="col area-invasion">
      <div className="panel is-primary">
        <div className="panel-title">{name.zone}</div>
        <div className="target">
          <div className="target-head">
            <Sprite kind="target" id={s.onBoss ? 'boss' : 'normal'} />
            <span className="target-name" data-boss={s.onBoss}>
              {s.onBoss ? s.bossName : s.normalName}
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

      <LogPanel s={s} title="観測記録" empty="まだ記録がない。" />
    </div>
  )
}
