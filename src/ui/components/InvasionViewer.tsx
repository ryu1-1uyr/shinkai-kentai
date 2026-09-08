import { useEffect, useRef } from 'react'
import { sortedByPower, totalSharks } from '../../game/inventory.ts'
import { launchRate } from '../../game/tick.ts'
import { pixelIcon } from '../../render/icons.ts'
import { sharkSprite } from '../../render/sharkSprite.ts'
import { getConfig, getSpeed, getState } from '../../store/gameStore.ts'

/**
 * 突撃ビュワー。
 *
 * ゲームの計算には一切関与しない「見せるだけ」の層。
 * 投入されたサメを 1:1 で描くが、同時に出せる数には上限を置く。
 * 上限を超えたぶんは 1 匹に束ね、束ねた数に応じて**大きく**描く。
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

/**
 * 同時に描くサメの上限。
 *
 * 恒久強化を積むと投入速度は 9 万体/秒を超える。1:1 で描くとフレームが落ちる。
 * ビュワーはおよそ 500x120 なので、サメ 1 体（34x20）で埋め尽くすのに 90 体ほど。
 * 1200 体なら画面 13 面ぶんの密度で、数えられない濁流として十分に見える。
 * 実測でこの上限なら 0.5 ms/フレーム、3000 体でも 1.3 ms しかかからないが、
 * それ以上並べても見た目が変わらないので描かない。
 */
const MAX_PARTICLES = 1200
/** 1 フレームに湧かせる上限。取りこぼした分は捨てる（溜めても描けない） */
const MAX_SPAWN_PER_FRAME = 120
const GRAVITY = 1100

/** 等倍のサメの高さ */
const SHARK_H = 20

/**
 * 1 秒あたりに湧かせるサメの数。これを超えたぶんは 1 匹に束ねる。
 * 画面が埋まる密度を保ったまま、それ以上は数ではなく大きさで表す。
 */
const SPAWN_CAP = 600

/**
 * 束ねた数が 10 倍になるごとに増える大きさ。
 *
 * 実測で、到達しうる投入速度は倍速 4 で 1.6M 体/秒あたりが上限で、
 * このとき束ねる数は 2600 ほど。係数 1.0 だと最大でも 88px にしかならず、
 * 建物（92px）を超えないまま終わってしまう。1.5 にすると
 * 束ね 430（超過強化 10 段・倍速 4 で届く）で建物を追い越す。
 */
const SCALE_PER_DECADE = 1.5

/** 大きさの上限。ビュワーの高さを超えると何も見えなくなる */
const MAX_SCALE = 6

/** 建物より大きい個体の動きの倍率。巨体はゆっくり動くほうが重く見える */
const GIANT_MOTION = 0.7

/**
 * 束ねる見せ方。
 *  log  … 束ねた数の対数に比例して滑らかに大きくなる
 *  step … 10 倍ごとに段階的に大きくなる
 */
export type BundleMode = 'log' | 'step'
let bundleMode: BundleMode = 'log'

export function getBundleMode(): BundleMode {
  return bundleMode
}

export function setBundleMode(m: BundleMode): void {
  bundleMode = m
}

/** 束ねた数に対する大きさ。段階表示は 10 倍ごとに切り上がる */
function sharkScale(bundle: number): number {
  if (bundle <= 1) return 1
  const decades = Math.log10(bundle)
  const d = bundleMode === 'log' ? decades : Math.floor(decades)
  return Math.min(MAX_SCALE, 1 + SCALE_PER_DECADE * d)
}

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
  /** 束ねた数に応じた大きさ。湧いた時点の値を保つ */
  scale: number
}

/** いま出撃しているのは最も弱い個体なので、その組み合わせの見た目を使う */
function launchingMask(): number {
  const s = getState()
  const stacks = sortedByPower(s.inv, s.ranks, getConfig(), s.powerCache)
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
      const buildingH = Math.min(h - 16, 92)

      // --- 出撃サメの見た目は 200ms ごとに更新（毎体引くと重い） ---
      keyAge += dt
      if (keyAge > 0.2) {
        keyAge = 0
        maskCache = launchingMask()
      }

      // --- 湧かせる ---
      if (s.phase === 'invasion' && !s.pendingDraft) {
        // 湧かせる数は SPAWN_CAP で頭打ちにし、超えたぶんは 1 匹に束ねて大きくする
        const rate = launchRate(s, cfg) * getSpeed()
        const bundle = Math.max(1, rate / SPAWN_CAP)
        const scale = sharkScale(bundle)
        const bodyH = SHARK_H * scale
        // 大きくなるほど数を減らす。面積で釣り合わせないと画面が塗り潰される
        const cap = Math.max(40, Math.round(MAX_PARTICLES / (scale * scale)))
        // 描ける以上に溜め込まない。溜めると上限到達後も湧き続けて無駄になる
        acc = Math.min(acc + dt * (rate / bundle), MAX_SPAWN_PER_FRAME)
        while (acc >= 1) {
          acc -= 1
          if (parts.length >= cap) {
            acc = 0
            break
          }
          parts.push({
            x: -14,
            y: bodyH / 2 + Math.random() * Math.max(10, ground - bodyH),
            vx: 240 + Math.random() * 160,
            vy: (Math.random() - 0.5) * 26,
            rot: 0,
            vrot: 0,
            alpha: 1,
            bounced: false,
            mask: maskCache,
            scale,
          })
        }
      } else {
        acc = 0
      }

      // --- 更新 ---
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i]
        // 建物より大きい個体は動きを落とす。等速だと軽く見えて質量が出ない
        const mdt = SHARK_H * p.scale >= buildingH ? dt * GIANT_MOTION : dt
        if (!p.bounced) {
          p.x += p.vx * mdt
          p.y += p.vy * mdt
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
          p.vy += GRAVITY * mdt
          p.x += p.vx * mdt
          p.y += p.vy * mdt
          p.rot += p.vrot * mdt
          p.alpha -= mdt * 1.25
        }
        if (p.alpha <= 0 || p.y > ground + 24 + SHARK_H * p.scale) parts.splice(i, 1)
      }
      if (flash > 0) flash -= dt

      // --- 描画 ---
      ctx.clearRect(0, 0, w, h)

      ctx.globalAlpha = 0.5
      ctx.fillStyle = getComputedStyle(canvas).getPropertyValue('--viewer-ground') || '#1e2f45'
      ctx.fillRect(0, ground, w, h - ground)
      ctx.globalAlpha = 1

      // 建物
      const bImg = pixelIcon(s.onBoss ? 'target:boss' : 'target:normal')
      if (bImg) {
        const bH = buildingH
        const bW = (bImg.width / bImg.height) * bH
        const bx0 = w - bW - 10
        const by0 = ground - bH
        if (flash > 0) {
          ctx.save()
          ctx.globalAlpha = Math.min(1, flash * 6)
          ctx.filter = 'brightness(2.6)'
          ctx.drawImage(bImg, bx0, by0, bW, bH)
          ctx.restore()
        }
        ctx.drawImage(bImg, bx0, by0, bW, bH)
      }

      // サメ
      // 同じフレームのサメはほぼ同じ mask なので、画像は使い回す
      let lastMask = -1
      let img = sharkSprite(0, 1)
      for (const p of parts) {
        if (p.mask !== lastMask) {
          lastMask = p.mask
          img = sharkSprite(p.mask, 1)
        }
        const sH = SHARK_H * p.scale
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

  const s = getState()
  const empty = totalSharks(s.inv) < 1

  return (
    <div className="viewer">
      <canvas className="viewer-canvas" ref={canvasRef} />
      {empty && <div className="viewer-empty">投入できる検体がない — 繁殖槽を増やせ</div>}
    </div>
  )
}
