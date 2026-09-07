import { useEffect, useRef } from 'react'
import { sharkSprite } from '../../render/sharkSprite.ts'
import { useAssetVersion } from '../useAssetVersion.ts'

/** 合成スプライトを DOM に置くための小さなラッパ */
export function SharkIcon({ mask, height = 20 }: { mask: number; height?: number }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const assetVersion = useAssetVersion()
  useEffect(() => {
    const c = ref.current
    if (!c) return
    const s = sharkSprite(mask, 1)
    // 縮小もするので整数倍に丸めない。補間は切ってあるので最近傍で縮む
    const scale = height / s.height
    c.width = Math.max(1, Math.round(s.width * scale))
    c.height = Math.max(1, Math.round(height))
    const g = c.getContext('2d')!
    g.imageSmoothingEnabled = false
    g.clearRect(0, 0, c.width, c.height)
    g.drawImage(s, 0, 0, c.width, c.height)
  }, [mask, height, assetVersion])
  return <canvas className="shark-icon" ref={ref} aria-hidden="true" />
}
