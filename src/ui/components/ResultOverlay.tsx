import { hasMutation, MUTATIONS, nameOfMask, powerOfMask } from '../../game/mutations.ts'
import { depthName } from '../../game/targets.ts'
import { getConfig, getLastAward, setScreen } from '../../store/gameStore.ts'
import { fmt, mmss } from '../format.ts'
import { useGame } from '../useGame.ts'
import { SharkIcon } from './SharkIcon.tsx'
import { Sprite } from './Sprite.tsx'

export function ResultOverlay() {
  const s = useGame()
  const cfg = getConfig()
  if (s.phase !== 'over') return null

  // 累計出生。在庫と違って減らないので、そのランで何を作ったかの記録になる
  /**
   * そのランで生まれた最も改造の進んだ個体。
   * 戦闘力ではなく**併せ持つ変異の数**で選ぶ。
   * 数字の大きさより「何をどれだけ盛ったか」がそのランの顔になるため。
   */
  const champion = [...s.births.entries()]
    .filter(([, count]) => count >= 1)
    .map(([mask, count]) => ({
      mask,
      count,
      power: powerOfMask(mask, s.ranks, cfg),
      traits: MUTATIONS.filter((m) => hasMutation(mask, m)).length,
    }))
    .sort((a, b) => b.traits - a.traits || b.power - a.power)[0]

  const species = [...s.births.entries()]
    .map(([mask, count]) => ({
      mask,
      count,
      power: powerOfMask(mask, s.ranks, cfg),
    }))
    .filter((x) => x.count >= 1)
    .sort((a, b) => b.power * b.count - a.power * a.count)
    .slice(0, 8)

  return (
    <div className="overlay">
      <div className="modal">
        <div>
          <div className="modal-title">
            <Sprite kind="ui" id="beam" /> 施設が逆探知されました
          </div>
          <div className="modal-sub">軌道上より照射を確認。研究施設は消失。実験記録のみが残された。</div>
        </div>

        <div className="result-grid">
          <div className="result-row">
            <span className="stat-label">突破深度</span>
            <span className="num">{s.clearedDepth}</span>
          </div>
          <div className="result-row">
            <span className="stat-label">到達地点</span>
            <span className="num">{depthName(s.depth).zone}</span>
          </div>
          <div className="result-row">
            <span className="stat-label">総戦果</span>
            <span className="num">{fmt(s.score)}</span>
          </div>
          <div className="result-row">
            <span className="stat-label">経過時間</span>
            <span className="num">{mmss(s.t)}</span>
          </div>
          <div className="result-row">
            <span className="stat-label">検体生産数</span>
            <span className="num">{fmt(s.producedTotal)}</span>
          </div>
          <div className="result-row">
            <span className="stat-label">研究予算</span>
            <span className="num award">+{fmt(getLastAward())}</span>
          </div>
        </div>

        {champion && champion.traits > 0 && (
          <div className="champion">
            <div className="panel-title">今回の最高到達サメ</div>
            <div className="champion-body">
              <SharkIcon mask={champion.mask} height={64} />
              <div className="champion-info">
                <div className="champion-name">{nameOfMask(champion.mask)}</div>
                <div className="champion-stats">
                  <span>変異 {champion.traits} 種</span>
                  <span>戦闘力 {fmt(champion.power)}</span>
                  <span>{fmt(champion.count)} 体</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div>
          <div className="panel-title">実験記録 — 生み出した検体</div>
          {species.map((sp) => (
            <div key={sp.mask} className="stack">
              <SharkIcon mask={sp.mask} height={30} />
              <span className="stack-name">{nameOfMask(sp.mask)}</span>
              <span className="stack-count">{fmt(sp.count)}</span>
              <span className="stack-power">{fmt(sp.power)}</span>
            </div>
          ))}
        </div>

        <button className="btn" onClick={() => setScreen('lab')}>
          研究所へ
        </button>
      </div>
    </div>
  )
}
