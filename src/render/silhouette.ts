import { asset } from './assets.ts'
import { BODY_W, BODY_X, BODY_Y, fallbackHalf, FRAME_H, FRAME_W, MID_Y } from './pixel.ts'

/**
 * base.png の実シルエットを読み取り、装飾の位置合わせに使う。
 *
 * 棘・砲塔・キノコ・装甲板などは「体のどこに付くか」で位置が決まる。
 * その基準を式で決め打ちすると、base.png を描き替えるたびに全部ズレる。
 * 画像の α を列ごとに走査して上端・下端を取れば、
 * **絵を描き替えても装飾が勝手に追従する**。
 *
 * 画像がまだ読めていない間は仮の輪郭（fallbackHalf）にフォールバックする。
 */

type Profile = {
  /** 列ごとの体の上端（フレーム座標）。不透明な画素が無い列は -1 */
  top: Int16Array
  /** 列ごとの体の下端（フレーム座標） */
  bottom: Int16Array
}

let cached: Profile | null = null
let cachedFrom: HTMLImageElement | null = null

function compute(img: HTMLImageElement): Profile {
  const c = document.createElement('canvas')
  c.width = FRAME_W
  c.height = FRAME_H
  const g = c.getContext('2d')!
  g.imageSmoothingEnabled = false
  g.drawImage(img, BODY_X, BODY_Y)
  const d = g.getImageData(0, 0, FRAME_W, FRAME_H).data

  const top = new Int16Array(FRAME_W).fill(-1)
  const bottom = new Int16Array(FRAME_W).fill(-1)
  for (let x = 0; x < FRAME_W; x++) {
    for (let y = 0; y < FRAME_H; y++) {
      if (d[(y * FRAME_W + x) * 4 + 3] < 128) continue
      if (top[x] < 0) top[x] = y
      bottom[x] = y
    }
  }
  return { top, bottom }
}

function profile(): Profile | null {
  const img = asset('base')
  if (!img) return null
  if (cachedFrom !== img) {
    cached = compute(img)
    cachedFrom = img
  }
  return cached
}

/** 実シルエットを読めているか */
export function hasSilhouette(): boolean {
  return profile() !== null
}

/** 体の上端。i は本体左端からの位置（0〜BODY_W）。戻り値はフレーム座標 */
export function bodyTop(i: number): number {
  const p = profile()
  const x = BODY_X + Math.round(i)
  if (p && x >= 0 && x < FRAME_W && p.top[x] >= 0) return p.top[x]
  return MID_Y - fallbackHalf(i)
}

/** 体の下端 */
export function bodyBottom(i: number): number {
  const p = profile()
  const x = BODY_X + Math.round(i)
  if (p && x >= 0 && x < FRAME_W && p.bottom[x] >= 0) return p.bottom[x]
  return MID_Y + fallbackHalf(i)
}

/** 体の縦半径 */
export function bodyHalf(i: number): number {
  return Math.max(0, (bodyBottom(i) - bodyTop(i)) / 2)
}

/** 体の縦中心（背びれなどを含むので、体だけの中心とは少しずれる） */
export function bodyMid(i: number): number {
  return (bodyTop(i) + bodyBottom(i)) / 2
}

/**
 * 細いひれを無視した「胴の上端」。
 * 背びれのように幅の狭い突起は、前後の列と比べて突出しているので除外する。
 */
export function trunkTop(i: number): number {
  const a = bodyTop(i - 6)
  const b = bodyTop(i)
  const c = bodyTop(i + 6)
  return Math.max(b, Math.min(a, c))
}

/** 体が存在する範囲か */
export function inBody(i: number): boolean {
  const p = profile()
  if (!p) return fallbackHalf(i) > 0
  const x = BODY_X + Math.round(i)
  return x >= 0 && x < FRAME_W && p.top[x] >= 0
}
