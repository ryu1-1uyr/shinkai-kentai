import { useEffect, useRef } from 'react'
import { sharkBounds, sharkSprite } from '../../render/sharkSprite.ts'
import { useAssetVersion } from '../useAssetVersion.ts'

/** 合成スプライトを DOM に置くための小さなラッパ */
export function SharkIcon({ mask, height = 20 }: { mask: number; height?: number }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const assetVersion = useAssetVersion()
  useEffect(() => {
    const c = ref.current
    if (!c) return
    const s = sharkSprite(mask, 1)
    // 枠の余白ごと縮めると実体が小さくなるので、不透明な範囲だけを切り出す
    const b = sharkBounds(mask, 1)
    const scale = height / b.h
    c.width = Math.max(1, Math.round(b.w * scale))
    c.height = Math.max(1, Math.round(height))
    const g = c.getContext('2d')!
    g.imageSmoothingEnabled = false
    g.clearRect(0, 0, c.width, c.height)
    g.drawImage(s, b.x, b.y, b.w, b.h, 0, 0, c.width, c.height)
  }, [mask, height, assetVersion])
  return <canvas className="shark-icon" ref={ref} aria-hidden="true" />
}
