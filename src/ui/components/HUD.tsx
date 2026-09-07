import { getSpeed, isAutoBuyOn, setSpeed, type Speed, toggleAutoBuy } from '../../store/gameStore.ts'
import { depthName } from '../../game/targets.ts'
import { mmss } from '../format.ts'
import { useGame } from '../useGame.ts'

const SPEEDS: Speed[] = [1, 2, 4]

export function HUD() {
  const s = useGame()
  const speed = getSpeed()
  const name = depthName(s.depth)
  const inCulture = s.phase === 'culture'

  return (
    <div className="hud">
      <div>
        <div className="hud-phase">{inCulture ? '培養フェーズ' : '侵略フェーズ'}</div>
        <div className="hud-depth">
          {inCulture ? '—' : `深度 ${s.depth}`}
          <span className="hud-depth-name"> {inCulture ? '検体を増やせ' : name.zone}</span>
        </div>
      </div>

      <div className="speed">
        {SPEEDS.filter((v) => v <= s.meta.maxSpeed).map((v) => (
          <button key={v} data-active={speed === v} onClick={() => setSpeed(v)}>
            ×{v}
          </button>
        ))}
        {s.meta.autoBuy && (
          <button data-active={isAutoBuyOn()} onClick={toggleAutoBuy}>
            自動発注
          </button>
        )}
      </div>

      <div className="hud-timer" data-warn={!inCulture && s.timeLeft <= 15}>
        {mmss(inCulture ? 60 - s.t : s.timeLeft)}
      </div>
    </div>
  )
}
