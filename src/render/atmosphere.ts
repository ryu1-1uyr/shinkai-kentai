/**
 * 深度に応じた空気の色。
 *
 * このゲームの目玉は「潜っていたはずが深度 11 で成層圏に出る」ことなのに、
 * 深度 1 と深度 11 で画面が同じでは何も伝わらない。
 * 背景を深度に連動させ、**深度 11 で暗闇から空へ反転させる**。
 *
 * 深度計が「深さ」から「常識からの逸脱度」に意味をすり替える瞬間を、
 * 画面全体で見せるための仕掛け。
 */

type RGB = [number, number, number]
export type Air = {
  /** 画面上部の色（光が届く側） */
  top: RGB
  /** 画面下部の色（闇の側） */
  bottom: RGB
  /** 差し色。ヴィネットや縁に薄く乗る */
  accent: RGB
}

/** 深度ごとの基準色。あいだは線形に混ぜる */
// 表として読むために整形を止めている（1 行 = 1 深度帯）
// prettier-ignore
const STOPS: Array<{ d: number; air: Air }> = [
  { d: 0, air: { top: [20, 52, 58], bottom: [4, 8, 10], accent: [69, 224, 200] } },   // 培養槽の中
  { d: 2, air: { top: [15, 43, 51], bottom: [3, 7, 10], accent: [69, 224, 200] } },   // 沿岸
  { d: 4, air: { top: [10, 33, 48], bottom: [2, 5, 10], accent: [80, 170, 220] } },   // 大陸棚
  { d: 6, air: { top: [7, 23, 38], bottom: [1, 3, 10], accent: [90, 130, 220] } },    // 漸深層
  { d: 8, air: { top: [4, 14, 28], bottom: [0, 2, 8], accent: [110, 100, 220] } },    // 深海層
  { d: 10, air: { top: [10, 6, 24], bottom: [3, 0, 8], accent: [150, 90, 220] } },    // 海溝
  // ここで反転する。計器の異常ということになっている
  { d: 11, air: { top: [58, 96, 140], bottom: [10, 22, 38], accent: [255, 210, 130] } },
  { d: 12, air: { top: [96, 150, 200], bottom: [24, 56, 90], accent: [255, 230, 170] } }, // 成層圏
  { d: 14, air: { top: [10, 10, 32], bottom: [0, 0, 6], accent: [180, 200, 255] } },   // 軌道上
  { d: 18, air: { top: [4, 2, 14], bottom: [0, 0, 3], accent: [220, 230, 255] } },
]

const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const mix = (a: RGB, b: RGB, t: RGB[0] extends never ? never : number): RGB => [
  Math.round(lerp(a[0], b[0], t)),
  Math.round(lerp(a[1], b[1], t)),
  Math.round(lerp(a[2], b[2], t)),
]

export function airAt(depth: number): Air {
  const d = Math.max(0, depth)
  if (d <= STOPS[0].d) return STOPS[0].air
  const last = STOPS[STOPS.length - 1]
  if (d >= last.d) return last.air
  for (let i = 0; i < STOPS.length - 1; i++) {
    const a = STOPS[i]
    const b = STOPS[i + 1]
    if (d < a.d || d > b.d) continue
    const t = (d - a.d) / (b.d - a.d)
    return {
      top: mix(a.air.top, b.air.top, t),
      bottom: mix(a.air.bottom, b.air.bottom, t),
      accent: mix(a.air.accent, b.air.accent, t),
    }
  }
  return last.air
}

export const rgb = (c: RGB) => `rgb(${c[0]} ${c[1]} ${c[2]})`
export const rgba = (c: RGB, a: number) => `rgb(${c[0]} ${c[1]} ${c[2]} / ${a})`

/** 深度 11 以降は「上」に向かっている扱い */
export function isAscending(depth: number): boolean {
  return depth >= 11
}
