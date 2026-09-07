import { useState } from 'react'
import {
  debugAddCulture,
  debugEndRun,
  debugGrant,
  debugSkipCulture,
  debugUnlockAll,
  getMeta,
  wipeMeta,
} from '../../store/gameStore.ts'
import { fmt } from '../format.ts'
import { useGame } from '../useGame.ts'
import { SpriteLab } from './SpriteLab.tsx'

/**
 * 開発用パネル。
 * import.meta.env.DEV で囲んであるため、本番ビルドではこのコンポーネントごと消える。
 */
export function DebugPanel() {
  const s = useGame()
  const [open, setOpen] = useState(false)
  const [lab, setLab] = useState(false)
  const meta = getMeta()

  if (!import.meta.env.DEV) return null

  if (!open) {
    return (
      <button className="dbg-toggle" onClick={() => setOpen(true)} title="デバッグパネル">
        DEV
      </button>
    )
  }

  return (
    <>
      {lab && <SpriteLab onClose={() => setLab(false)} />}
    <div className="dbg">
      <div className="dbg-head">
        <span>DEV</span>
        <button onClick={() => setOpen(false)}>×</button>
      </div>
      <div className="dbg-row">
        予算 {fmt(meta.budget)} / 深度 {s.depth} / {s.phase}
      </div>
      <div className="dbg-btns">
        <button onClick={debugUnlockAll}>全解禁 + 強化MAX</button>
        <button onClick={() => debugGrant(100000)}>予算 +100k</button>
        <button onClick={() => debugGrant(10000000)}>予算 +10M</button>
        <button onClick={() => debugAddCulture(1e6)}>培養液 +1M</button>
        <button onClick={debugSkipCulture}>培養フェーズを飛ばす</button>
        <button onClick={debugEndRun}>ランを終了</button>
        <button onClick={() => setLab(true)}>スプライト合成を確認</button>
        <button onClick={wipeMeta}>メタをリセット</button>
      </div>
    </div>
    </>
  )
}
