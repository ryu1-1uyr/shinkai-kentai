import { useEffect, useRef, useState } from 'react'
import { isAscending } from '../../render/atmosphere.ts'
import { useGame } from '../useGame.ts'
import { t } from '../../text/index.ts'

/**
 * 深度が切り替わった瞬間の演出。
 *
 * 背景の色は 900ms かけて滑らかに変わるが、それだけだと
 * 「いま突破した」という手応えが無い。深度が上がるたびに一瞬光らせる。
 *
 * 深度 11 は特別扱いする。潜っていたはずが上昇に転じる地点であり、
 * このゲームで最も大きな仕掛けなので、白く飛ばしたうえで
 * 深度計の異常として告知する。
 */
type Burst = { id: number; kind: 'depth' | 'invert' }

export function DepthFlash() {
  const s = useGame()
  const prev = useRef<number | null>(null)
  const seq = useRef(0)
  const [burst, setBurst] = useState<Burst | null>(null)

  const depth = s.phase === 'invasion' ? s.depth : 0

  useEffect(() => {
    const before = prev.current
    prev.current = depth
    if (before === null || depth <= before) return

    // 上昇に転じた瞬間だけ別演出にする
    const crossed = isAscending(depth) && !isAscending(before)
    seq.current += 1
    setBurst({ id: seq.current, kind: crossed ? 'invert' : 'depth' })
  }, [depth])

  useEffect(() => {
    if (!burst) return
    const ms = burst.kind === 'invert' ? 2600 : 700
    const t = window.setTimeout(() => setBurst(null), ms)
    return () => window.clearTimeout(t)
  }, [burst])

  if (!burst) return null

  return (
    <div className="depth-fx" data-kind={burst.kind} key={burst.id} aria-hidden="true">
      <div className="depth-fx-flash" />
      {burst.kind === 'invert' && (
        <div className="depth-fx-notice">
          <span className="depth-fx-alarm">{t.invasion.flashTitle}</span>
          <span className="depth-fx-sub">{t.invasion.flashSub}</span>
        </div>
      )}
    </div>
  )
}
