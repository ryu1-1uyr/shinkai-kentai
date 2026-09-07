import { useEffect, useRef } from 'react'
import { sharkSprite } from '../../render/sharkSprite.ts'

/** 合成スプライトを DOM に置くための小さなラッパ */
export function SharkIcon({ mask, height = 20 }: { mask: number; height?: number }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = ref.current
    if (!c) return
    const s = sharkSprite(mask, 1)
    const scale = Math.max(1, Math.round(height / s.height)) || 1
    c.width = s.width * scale
    c.height = s.height * scale
    const g = c.getContext('2d')!
    g.imageSmoothingEnabled = false
    g.clearRect(0, 0, c.width, c.height)
    g.drawImage(s, 0, 0, c.width, c.height)
  }, [mask, height])
  return <canvas className="shark-icon" ref={ref} aria-hidden="true" />
}
