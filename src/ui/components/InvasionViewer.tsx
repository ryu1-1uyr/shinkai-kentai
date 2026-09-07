import { useEffect, useRef } from 'react'
import { sortedByPower } from '../../game/inventory.ts'
import { launchRate } from '../../game/tick.ts'
import { sharkSprite } from '../../render/sharkSprite.ts'
import { getConfig, getSpeed, getState } from '../../store/gameStore.ts'

/**
 * 突撃ビュワー。
 *
 * ゲームの計算には一切関与しない「見せるだけ」の層。
 * 投入されたサメを 1:1 で描く（実測した投入速度の上限は 113 体/秒で、
 * ゲーム全体を通してこれを超えないため間引きは不要）。
 *
 * 描画を canvas にしているのは 2 つの理由による。
 *  1. 数百体を DOM で持つと重い
 *  2. グラフィックをドット絵にする方針が決まっており、
 *     canvas なら imageSmoothingEnabled = false でそのまま等倍拡大できる
 *
 * スプライトはいま絵文字をオフスクリーンに焼いて drawImage しているだけなので、
 * 画像を差し替えるときは SPRITE_SOURCE の中身を PNG のロードに変えれば
 * 描画側のコードは変わらない。
 */

const MAX_PARTICLES = 3000
const GRAVITY = 1100

type P = {
  x: number
  y: number
  vx: number
  vy: number
  rot: number
  vrot: number
  alpha: number
  bounced: boolean
  mask: number
}

/**
 * 建物は当面フォールバックの絵文字を焼いて使う。
 * サメ側は sharkSprite が合成済みのスプライトを返すのでそのまま drawImage する。
 */
const TARGET_GLYPH: Record<string, string> = {
  'target:normal': '🏢',
  'target:boss': '🏛',
}

const cache = new Map<string, HTMLCanvasElement>()

function sprite(key: string, size: number): HTMLCanvasElement {
  const id = `${key}@${size}`
  const hit = cache.get(id)
  if (hit) return hit
  const c = document.createElement('canvas')
  c.width = size
  c.height = size
  const g = c.getContext('2d')!
  g.font = `${Math.floor(size * 0.82)}px serif`
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.fillText(TARGET_GLYPH[key] ?? '🏢', size / 2, size / 2 + 1)
  cache.set(id, c)
  return c
}

/** いま出撃しているのは最も弱い個体なので、その組み合わせの見た目を使う */
function launchingMask(): number {
  const s = getState()
  const stacks = sortedByPower(s.inv, s.ranks, getConfig())
  return stacks.find((x) => x.count >= 1)?.mask ?? 0
}

export function InvasionViewer() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let w = 0
    let h = 0
    let dpr = 1
    const resize = () => {
      const r = canvas.getBoundingClientRect()
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = r.width
      h = r.height
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      // ドット絵を等倍拡大したときにボケさせない
      ctx.imageSmoothingEnabled = false
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    const parts: P[] = []
    let acc = 0
    let last = performance.now()
    let flash = 0
    let maskCache = 0
    let keyAge = 0
    let raf = 0

    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.1)
      last = now

      const s = getState()
      const cfg = getConfig()
      const ground = h - 10
      const hitX = w - 46

      // --- 出撃サメの見た目は 200ms ごとに更新（毎体引くと重い） ---
      keyAge += dt
      if (keyAge > 0.2) {
        keyAge = 0
        maskCache = launchingMask()
      }

      // --- 湧かせる（実際の投入速度そのまま） ---
      if (s.phase === 'invasion' && !s.pendingOffers) {
        acc += dt * launchRate(s, cfg) * getSpeed()
        let guard = 0
        while (acc >= 1 && guard++ < 120) {
          acc -= 1
          if (parts.length >= MAX_PARTICLES) break
          parts.push({
            x: -14,
            y: 14 + Math.random() * Math.max(10, ground - 28),
            vx: 240 + Math.random() * 160,
            vy: (Math.random() - 0.5) * 26,
            rot: 0,
            vrot: 0,
            alpha: 1,
            bounced: false,
            mask: maskCache,
          })
        }
      } else {
        acc = 0
      }

      // --- 更新 ---
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i]
        if (!p.bounced) {
          p.x += p.vx * dt
          p.y += p.vy * dt
          if (p.x >= hitX) {
            // 建物にぶつかって跳ね返る
            p.bounced = true
            p.x = hitX
            p.vx = -(70 + Math.random() * 150)
            p.vy = -(130 + Math.random() * 190)
            p.vrot = (Math.random() - 0.5) * 14
            flash = 0.11
          }
        } else {
          p.vy += GRAVITY * dt
          p.x += p.vx * dt
          p.y += p.vy * dt
          p.rot += p.vrot * dt
          p.alpha -= dt * 1.25
        }
        if (p.alpha <= 0 || p.y > ground + 24) parts.splice(i, 1)
      }
      if (flash > 0) flash -= dt

      // --- 描画 ---
      ctx.clearRect(0, 0, w, h)

      ctx.globalAlpha = 0.5
      ctx.fillStyle = getComputedStyle(canvas).getPropertyValue('--viewer-ground') || '#1e2f45'
      ctx.fillRect(0, ground, w, h - ground)
      ctx.globalAlpha = 1

      // 建物
      const bSize = 46
      const bImg = sprite(s.onBoss ? 'target:boss' : 'target:normal', 64)
      if (flash > 0) {
        ctx.save()
        ctx.globalAlpha = Math.min(1, flash * 6)
        ctx.filter = 'brightness(2.4)'
        ctx.drawImage(bImg, w - bSize - 14, ground - bSize, bSize, bSize)
        ctx.restore()
      }
      ctx.drawImage(bImg, w - bSize - 14, ground - bSize, bSize, bSize)

      // サメ
      const sH = 20
      for (const p of parts) {
        const img = sharkSprite(p.mask, 1)
        const w = (img.width / img.height) * sH
        if (p.bounced) {
          ctx.save()
          ctx.globalAlpha = Math.max(0, p.alpha)
          ctx.translate(p.x, p.y)
          ctx.rotate(p.rot)
          ctx.drawImage(img, -w / 2, -sH / 2, w, sH)
          ctx.restore()
        } else {
          ctx.drawImage(img, p.x - w / 2, p.y - sH / 2, w, sH)
        }
      }

      raf = requestAnimationFrame(loop)
    }

    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [])

  return (
    <div className="viewer">
      <canvas className="viewer-canvas" ref={canvasRef} />
    </div>
  )
}
