import {
  type AutoBuyMode,
  getAutoBuyMode,
  getSpeed,
  setAutoBuyMode,
  setSpeed,
  type Speed,
} from '../../store/gameStore.ts'
import { depthName } from '../../game/targets.ts'
import { mmss } from '../format.ts'
import { useGame } from '../useGame.ts'

const SPEEDS: Speed[] = [1, 2, 4]

export function HUD() {
  const s = useGame()
  const speed = getSpeed()
  const name = depthName(s.depth)
  const inCulture = s.phase === 'culture'
  const autoMode = getAutoBuyMode()
  // 解禁したモードだけを並べる。1 つしかないなら切り替える意味がないので出さない
  const autoModes: Array<[AutoBuyMode, string]> = [
    ['off', '手動'],
    ...(s.meta.autoBuyOne ? ([['one', '定期発注']] as Array<[AutoBuyMode, string]>) : []),
    ...(s.meta.autoBuyAll ? ([['all', 'AI 発注']] as Array<[AutoBuyMode, string]>) : []),
  ]

  return (
    <div className="hud">
      <div>
        <div className="hud-phase">{inCulture ? '培養フェーズ' : '侵略フェーズ'}</div>
        <div className="hud-depth">
          {inCulture ? '培養槽' : `深度 ${s.depth}`}
          <span className="hud-depth-name">{inCulture ? '安全' : name.zone}</span>
        </div>
      </div>

      <div className="speed" style={{ marginRight: 'auto' }}>
        {SPEEDS.filter((v) => v <= s.meta.maxSpeed).map((v) => (
          <button key={v} data-active={speed === v} onClick={() => setSpeed(v)}>
            ×{v}
          </button>
        ))}
        {autoModes.length > 1 && (
          <span className="autobuy">
            {autoModes.map(([mode, label]) => (
              <button key={mode} data-active={autoMode === mode} onClick={() => setAutoBuyMode(mode)}>
                {label}
              </button>
            ))}
          </span>
        )}
      </div>

      {s.meta.reserveSeconds > 0 && (
        <span className="reserve" data-spent={s.reserveUsed}>
          予備電源 {s.reserveUsed ? '使用済み' : `+${s.meta.reserveSeconds}s`}
        </span>
      )}

      {/* 培養中は中央に円タイマーが出ているので、同じ数字を二重に出さない */}
      {inCulture ? (
        <div className="hud-standby">検体を増やせ</div>
      ) : (
        <div className="hud-timer" data-warn={s.timeLeft <= 15}>
          {mmss(s.timeLeft)}
        </div>
      )}
    </div>
  )
}
