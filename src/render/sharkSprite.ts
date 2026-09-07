import type { MutationDef, MutationId, MutationMask } from '../game/mutations.ts'
import { drawLayer, onAssetLoaded } from './assets.ts'
import { hasMutation, MUTATIONS } from '../game/mutations.ts'
import {
  BODY_W,
  BODY_X,
  bodyHalf,
  drawBody,
  drawFin,
  drawTail,
  FRAME_H,
  FRAME_W,
  MID_Y,
  outline,
  PALETTE,
  px,
  type RGB,
  tintBands,
} from './pixel.ts'

/**
 * 複合サメのスプライトを組み立てる。
 *
 * 変異は 18 種あり、組み合わせは 2^18 = 262,144 通りある。
 * 差分を描き分けるのは不可能なので、変異ごとに「絵のどこをどういじるか」だけを定義し、
 * 描画時に積み上げて 1 枚に焼く。
 *
 * チャンネルが違えば無条件に重なる。
 *   part     … 部位の置換（スロットごとに排他。レア度が高い方が勝つ）
 *   attach   … 部位の追加（重複可）
 *   transform… 大きさ・体数・傾き（乗算）
 *   palette  … 色を寄せる（順に合成）
 *   overlay  … 全身のエフェクト（加算）
 *
 * 合成した結果は mask 単位でキャッシュするため、コストは
 * 「その種類が初めて描かれた 1 回」だけで済む。
 */

type Ctx = CanvasRenderingContext2D

export type PartSlot = 'head' | 'tail' | 'body'

export type Visual = {
  part?: { slot: PartSlot; draw: (ctx: Ctx) => void }
  attach?: (ctx: Ctx) => void
  transform?: { scale?: number; count?: number; tilt?: number; alpha?: number }
  palette?: { rgb: RGB; amount: number }
  overlay?: (ctx: Ctx) => void
}

const RARITY_PRIORITY = { common: 1, uncommon: 2, rare: 3, legendary: 4 } as const

// ---------------------------------------------------------------------------
// 変異ごとの見た目
// ---------------------------------------------------------------------------

const VISUALS: Partial<Record<MutationId, Visual>> = {
  // --- 生体系 ---
  glow: {
    overlay: (ctx) => outline(ctx, FRAME_W, FRAME_H, [140, 255, 210], 0.85),
  },
  frenzy: {
    palette: { rgb: [210, 60, 50], amount: 0.42 },
    attach: (ctx) => {
      // 開いた口と牙
      px(ctx, BODY_X + 44, MID_Y + 1, 6, 1, PALETTE.mouth)
      for (let i = 0; i < 3; i++) px(ctx, BODY_X + 45 + i * 2, MID_Y - 1, 1, 2, '#ffffff')
    },
  },
  twinHead: {
    part: {
      slot: 'head',
      draw: (ctx) => {
        // 頭をもう 1 つ、少し上にずらして生やす
        for (let i = 30; i < BODY_W; i++) {
          const h = Math.round(bodyHalf(i) * 0.72)
          if (h <= 0) continue
          px(ctx, BODY_X + i + 2, MID_Y - 9 - h, 1, h * 2, PALETTE.body)
        }
        px(ctx, BODY_X + 42, MID_Y - 12, 2, 2, PALETTE.eye)
      },
    },
  },
  swarm: {
    // 「ダブル」なので 2 体。名前と見た目を一致させる
    transform: { count: 2, scale: 0.74 },
  },
  triple: {
    transform: { count: 3, scale: 0.66 },
  },
  swift: {
    // 細長い体型にする
    transform: { scale: 0.92 },
    palette: { rgb: [150, 200, 230], amount: 0.25 },
  },
  albino: {
    palette: { rgb: [244, 240, 236], amount: 0.72 },
  },
  spike: {
    attach: (ctx) => {
      // 背に並ぶ棘
      for (let i = 0; i < 8; i++) {
        const x = 12 + i * 4
        const h = bodyHalf(x)
        drawFin(ctx, BODY_X + x, MID_Y - h, 3, 4, -1, '#e8e2d4')
      }
    },
  },
  poison: {
    palette: { rgb: [110, 190, 90], amount: 0.5 },
    overlay: (ctx) => {
      for (let i = 0; i < 10; i++) {
        px(ctx, BODY_X + 4 + ((i * 13) % 40), MID_Y - 10 + ((i * 7) % 20), 2, 2, '#c8ff7a')
      }
    },
  },
  tripleHead: {
    part: {
      slot: 'head',
      draw: (ctx) => {
        // 頭を上下に 2 つ足して 3 つにする
        for (const dy of [-10, 10]) {
          for (let i = 30; i < BODY_W; i++) {
            const h = Math.round(bodyHalf(i) * 0.66)
            if (h <= 0) continue
            px(ctx, BODY_X + i + 2, MID_Y + dy - h, 1, h * 2, PALETTE.body)
          }
          px(ctx, BODY_X + 42, MID_Y + dy - 3, 2, 2, PALETTE.eye)
        }
      },
    },
  },
  fungus: {
    palette: { rgb: [180, 150, 120], amount: 0.3 },
    attach: (ctx) => {
      // 背から生えたキノコ
      for (const [x, sz] of [[16, 5], [24, 7], [33, 4]] as const) {
        const top = MID_Y - bodyHalf(x)
        px(ctx, BODY_X + x + 1, top - sz, 2, sz, '#e8dcc8')
        px(ctx, BODY_X + x - 1, top - sz - 3, sz + 2, 3, '#d4534a')
        px(ctx, BODY_X + x, top - sz - 2, 1, 1, '#f6e0d8')
      }
    },
  },
  ghost: {
    // 半透明にする。絵は増やさず alpha だけで表現できる
    transform: { alpha: 0.45 },
    palette: { rgb: [190, 215, 255], amount: 0.5 },
    overlay: (ctx) => outline(ctx, FRAME_W, FRAME_H, [200, 230, 255], 0.4),
  },
  zombie: {
    palette: { rgb: [120, 140, 95], amount: 0.55 },
    attach: (ctx) => {
      // 欠けた体と剥き出しの骨
      for (const [x, y, w] of [[14, -3, 4], [22, 2, 3], [30, -5, 3]] as const) {
        px(ctx, BODY_X + x, MID_Y + y, w, 3, '#2a2f22')
        px(ctx, BODY_X + x, MID_Y + y + 1, w, 1, '#ddd6c0')
      }
    },
  },

  // --- 災害系 ---
  tornado: {
    transform: { tilt: 0.34 },
    overlay: (ctx) => {
      // 巻き上がる渦
      for (let i = 0; i < 14; i++) {
        const y = MID_Y - 14 + i * 2
        const w = 3 + Math.abs(Math.sin(i * 0.8)) * 12
        px(ctx, BODY_X + 20 - w / 2, y, w, 1, i % 2 ? '#b9d8e8' : '#7fa8c4')
      }
    },
  },
  magma: {
    palette: { rgb: [220, 90, 30], amount: 0.55 },
  },
  frozen: {
    palette: { rgb: [190, 230, 255], amount: 0.5 },
    attach: (ctx) => {
      // 体を覆う氷塊
      for (const [x, y] of [[14, -6], [22, 4], [30, -4], [38, 2]] as const) {
        px(ctx, BODY_X + x, MID_Y + y, 5, 5, '#dff2ff')
        px(ctx, BODY_X + x + 1, MID_Y + y + 1, 2, 2, '#ffffff')
      }
    },
  },
  storm: {
    overlay: (ctx) => {
      // 吹き付ける風の筋
      for (let i = 0; i < 9; i++) {
        const y = MID_Y - 14 + i * 3.4
        px(ctx, BODY_X - 6 + ((i * 5) % 10), y, 14 + (i % 3) * 6, 1, '#cfe3f0')
      }
    },
  },
  tsunami: {
    transform: { scale: 1.35 },
    overlay: (ctx) => {
      // 巻き込む水しぶき
      for (let i = 0; i < 22; i++) {
        const x = BODY_X - 4 + i * 3
        const y = MID_Y + Math.round(Math.sin(i * 0.55) * 11)
        px(ctx, x, y, 2, 2, i % 3 ? '#7fd4ff' : '#ffffff')
      }
    },
  },
  giant: {
    transform: { scale: 1.5 },
  },
  ancient: {
    palette: { rgb: [150, 128, 84], amount: 0.45 },
    attach: (ctx) => {
      // 背に骨質の隆起
      for (let i = 0; i < 5; i++) {
        px(ctx, BODY_X + 16 + i * 5, MID_Y - bodyHalf(16 + i * 5) - 2, 2, 3, '#e6dcc0')
      }
    },
  },

  // --- 深海系 ---
  pressure: {
    palette: { rgb: [110, 138, 160], amount: 0.4 },
    transform: { scale: 1.12 },
  },
  abyss: {
    palette: { rgb: [40, 30, 78], amount: 0.55 },
    overlay: (ctx) => outline(ctx, FRAME_W, FRAME_H, [120, 90, 220], 0.5),
  },
  tentacle: {
    part: {
      slot: 'tail',
      draw: (ctx) => {
        // 尾びれをタコ足に置き換える
        for (let t = 0; t < 4; t++) {
          const baseY = MID_Y - 6 + t * 4
          for (let i = 0; i < 12; i++) {
            const wob = Math.round(Math.sin(i * 0.7 + t * 1.9) * 2)
            px(ctx, BODY_X + 2 - i, baseY + wob, 1, 2, t % 2 ? '#8c5a86' : '#a06898')
          }
        }
      },
    },
  },
  eldritch: {
    palette: { rgb: [90, 40, 110], amount: 0.35 },
    attach: (ctx) => {
      // 体表に増えた眼
      for (const [x, y] of [[20, -4], [26, 2], [32, -6], [36, 3], [24, -8]] as const) {
        px(ctx, BODY_X + x, MID_Y + y, 3, 3, '#ffe98a')
        px(ctx, BODY_X + x + 1, MID_Y + y + 1, 1, 1, '#1a0f24')
      }
    },
  },

  // --- 機械系 ---
  armor: {
    attach: (ctx) => {
      for (let i = 12; i < 40; i += 6) {
        const h = bodyHalf(i)
        px(ctx, BODY_X + i, MID_Y - h, 4, h * 2, PALETTE.metal)
        px(ctx, BODY_X + i, MID_Y - h, 4, 1, PALETTE.metalDark)
      }
    },
  },
  mecha: {
    part: {
      slot: 'body',
      draw: (ctx) => {
        // 胴の後ろ半分を機械に置換
        drawBody(ctx, { from: 0, to: 26, body: PALETTE.metal, belly: '#cdd4da' })
        for (let i = 6; i < 26; i += 5) px(ctx, BODY_X + i, MID_Y - bodyHalf(i), 1, bodyHalf(i) * 2, PALETTE.metalDark)
        px(ctx, BODY_X + 10, MID_Y - 2, 4, 4, '#ff6a4d')
      },
    },
  },
  volt: {
    overlay: (ctx) => {
      ctx.globalAlpha = 0.95
      for (let s = 0; s < 3; s++) {
        let x = BODY_X + 10 + s * 12
        let y = MID_Y - 12 + s * 3
        for (let i = 0; i < 7; i++) {
          px(ctx, x, y, 2, 1, '#8ff0ff')
          x += i % 2 ? 2 : -1
          y += 2
        }
      }
      ctx.globalAlpha = 1
    },
  },
  autonomous: {
    attach: (ctx) => {
      // 背に砲塔
      px(ctx, BODY_X + 24, MID_Y - bodyHalf(24) - 5, 8, 5, PALETTE.metal)
      px(ctx, BODY_X + 30, MID_Y - bodyHalf(24) - 4, 7, 2, PALETTE.metalDark)
      px(ctx, BODY_X + 26, MID_Y - bodyHalf(24) - 7, 2, 2, '#ff4d4d')
    },
  },

  // --- 宇宙系 ---
  zeroG: {
    transform: { tilt: -0.28 },
    palette: { rgb: [200, 220, 255], amount: 0.25 },
  },
  meteor: {
    overlay: (ctx) => {
      // 尾を引く火の粉
      for (let i = 0; i < 18; i++) {
        const x = BODY_X - 2 - i
        const y = MID_Y + Math.round(Math.sin(i * 0.9) * 3)
        const c = i < 6 ? '#fff2a0' : i < 12 ? '#ff9d3c' : '#d94a2a'
        px(ctx, x, y, 2, 2, c)
      }
    },
  },
  cosmic: {
    palette: { rgb: [24, 16, 52], amount: 0.6 },
    overlay: (ctx) => {
      // 体表に星空
      for (let i = 0; i < 26; i++) {
        const gx = BODY_X + 6 + ((i * 17) % 40)
        const gy = MID_Y - 8 + ((i * 11) % 16)
        px(ctx, gx, gy, 1, 1, i % 4 ? '#ffffff' : '#9fd0ff')
      }
    },
  },
  alien: {
    palette: { rgb: [80, 230, 120], amount: 0.5 },
    attach: (ctx) => {
      // 触角と大きい単眼
      px(ctx, BODY_X + 40, MID_Y - bodyHalf(40) - 6, 1, 6, '#c8ffd8')
      px(ctx, BODY_X + 39, MID_Y - bodyHalf(40) - 8, 3, 3, '#e8ff6a')
      px(ctx, BODY_X + 41, MID_Y - 3, 5, 5, '#111820')
      px(ctx, BODY_X + 42, MID_Y - 2, 2, 2, '#c8ff6a')
    },
  },
}

// ---------------------------------------------------------------------------
// 合成
// ---------------------------------------------------------------------------

function newCanvas(w: number, h: number): { c: HTMLCanvasElement; g: Ctx } {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const g = c.getContext('2d')!
  g.imageSmoothingEnabled = false
  return { c, g }
}

/**
 * ベースのサメ 1 体ぶん（部位の置換を反映して）を 1 枚に描く。
 * 各レイヤーは public/sprites/ に同名の PNG を置けば差し替わる。
 */
function drawOne(
  g: Ctx,
  parts: Map<PartSlot, { id: MutationId; part: NonNullable<Visual['part']> }>,
  attaches: Array<{ id: MutationId; draw: (c: Ctx) => void }>,
): void {
  const tail = parts.get('tail')
  const body = parts.get('body')
  const head = parts.get('head')

  // 尾（置換されていなければ既定の尾びれ）
  if (tail) drawLayer(g, `part/tail/${tail.id}`, tail.part.draw)
  else drawLayer(g, 'part/tail/default', drawTail)

  // 胴とヒレ
  drawLayer(g, 'base', (c) => {
    drawBody(c)
    drawFin(c, BODY_X + 18, MID_Y - bodyHalf(18), 9, 7, -1)
    drawFin(c, BODY_X + 30, MID_Y + bodyHalf(30) - 1, 7, 5, 1)
    px(c, BODY_X + 41, MID_Y - 3, 2, 2, PALETTE.eye)
    px(c, BODY_X + 43, MID_Y + 2, 5, 1, PALETTE.mouth)
  })

  if (body) drawLayer(g, `part/body/${body.id}`, body.part.draw)
  if (head) drawLayer(g, `part/head/${head.id}`, head.part.draw)
  for (const a of attaches) drawLayer(g, `attach/${a.id}`, a.draw)
}

const cache = new Map<string, HTMLCanvasElement>()

/**
 * 変異の組み合わせからスプライトを作る。結果は mask 単位でキャッシュする。
 * scale は論理ピクセル 1 つを何 px で描くか。
 */
export function sharkSprite(mask: MutationMask, scale = 1): HTMLCanvasElement {
  const key = `${mask}@${scale}`
  const hit = cache.get(key)
  if (hit) return hit

  const defs: MutationDef[] = MUTATIONS.filter((m) => hasMutation(mask, m))

  // --- チャンネルごとに集約 ---
  const parts = new Map<PartSlot, { id: MutationId; part: NonNullable<Visual['part']> }>()
  const partPriority = new Map<PartSlot, number>()
  const attaches: Array<{ id: MutationId; draw: (c: Ctx) => void }> = []
  const palettes: Array<{ rgb: RGB; amount: number }> = []
  const overlays: Array<{ id: MutationId; draw: (c: Ctx) => void }> = []
  let scaleMult = 1
  let count = 1
  let tilt = 0
  let alpha = 1

  for (const d of defs) {
    const v = VISUALS[d.id]
    if (!v) continue
    if (v.part) {
      // 同じスロットを取り合ったらレア度が高い方が勝つ
      const p = RARITY_PRIORITY[d.rarity]
      if ((partPriority.get(v.part.slot) ?? -1) < p) {
        parts.set(v.part.slot, { id: d.id, part: v.part })
        partPriority.set(v.part.slot, p)
      }
    }
    if (v.attach) attaches.push({ id: d.id, draw: v.attach })
    if (v.palette) palettes.push(v.palette)
    if (v.overlay) overlays.push({ id: d.id, draw: v.overlay })
    if (v.transform) {
      if (v.transform.scale) scaleMult *= v.transform.scale
      if (v.transform.count) count = Math.max(count, v.transform.count)
      if (v.transform.tilt) tilt += v.transform.tilt
      if (v.transform.alpha !== undefined) alpha *= v.transform.alpha
    }
  }

  // --- 1 体ぶんを論理サイズで描く ---
  const { c: unit, g: ug } = newCanvas(FRAME_W, FRAME_H)
  drawOne(ug, parts, attaches)
  // 色を変える変異が複数あるときは、混ぜずに体を等分して塗り分ける
  tintBands(ug, FRAME_W, FRAME_H, palettes, BODY_X, BODY_X + BODY_W)
  for (const o of overlays) drawLayer(ug, `overlay/${o.id}`, o.draw)

  // --- 変形を適用して最終キャンバスへ ---
  const outW = Math.ceil(FRAME_W * scaleMult * scale)
  const outH = Math.ceil(FRAME_H * scaleMult * scale)
  const { c: out, g } = newCanvas(outW, outH)

  const placements =
    count === 1
      ? [{ x: 0, y: 0, s: 1 }]
      : [
          { x: -0.14, y: -0.13, s: 0.78 },
          { x: 0.16, y: 0.12, s: 0.84 },
          { x: 0.44, y: -0.03, s: 0.7 },
        ].slice(0, count)

  g.globalAlpha = alpha
  for (const p of placements) {
    g.save()
    g.translate(p.x * outW + outW / 2, p.y * outH + outH / 2)
    if (tilt) g.rotate(tilt)
    const w = outW * p.s
    const h = outH * p.s
    g.drawImage(unit, -w / 2, -h / 2, w, h)
    g.restore()
  }
  g.globalAlpha = 1

  cache.set(key, out)
  return out
}

/** 在庫やリザルトなど、DOM に画像として置きたい場所向け */
export function sharkDataUrl(mask: MutationMask, scale = 2): string {
  return sharkSprite(mask, scale).toDataURL()
}

// 画像が後から読み込まれたら、合成済みのキャッシュを捨てて描き直させる
onAssetLoaded(() => cache.clear())
