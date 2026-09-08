/**
 * base.png の頭部だけを切り出してファビコンにする。
 *
 * 絵を差し替えたら `node tools/make-favicon.ts` を回せば追従する。
 * 出力はドット絵をそのまま整数倍に拡大したもので、補間はかけない。
 */
import { decodePng, writePng } from './png.ts'

const SRC = 'public/sprites/base.png'
const OUT = 'public/favicon.png'
/** sharkSprite.ts の HEAD_FROM と同じ。ここから右が頭 */
const HEAD_FROM = 66
/** 書き出す一辺 */
const SIZE = 64

const { width, height, rgba } = decodePng(SRC)
const at = (x: number, y: number) => (y * width + x) * 4

// 頭の範囲のうち、実際に色が乗っている矩形を求める
let x0 = width
let x1 = -1
let y0 = height
let y1 = -1
for (let y = 0; y < height; y++) {
  for (let x = HEAD_FROM; x < width; x++) {
    if (rgba[at(x, y) + 3] < 8) continue
    if (x < x0) x0 = x
    if (x > x1) x1 = x
    if (y < y0) y0 = y
    if (y > y1) y1 = y
  }
}
if (x1 < 0) throw new Error('頭の範囲に不透明な画素がない')

const w = x1 - x0 + 1
const h = y1 - y0 + 1
// 正方形に収める。1 ドットが何 px になるかは整数に落として輪郭を保つ
const side = Math.max(w, h)
const scale = Math.max(1, Math.floor(SIZE / side))
const out = new Uint8Array(SIZE * SIZE * 4)
const offX = Math.floor((SIZE - w * scale) / 2)
const offY = Math.floor((SIZE - h * scale) / 2)

for (let y = 0; y < h; y++) {
  for (let x = 0; x < w; x++) {
    const s = at(x0 + x, y0 + y)
    if (rgba[s + 3] < 8) continue
    for (let dy = 0; dy < scale; dy++) {
      for (let dx = 0; dx < scale; dx++) {
        const px = offX + x * scale + dx
        const py = offY + y * scale + dy
        if (px < 0 || py < 0 || px >= SIZE || py >= SIZE) continue
        const d = (py * SIZE + px) * 4
        out[d] = rgba[s]
        out[d + 1] = rgba[s + 1]
        out[d + 2] = rgba[s + 2]
        out[d + 3] = rgba[s + 3]
      }
    }
  }
}

writePng(OUT, SIZE, SIZE, out)
console.log(`頭の範囲 ${w}x${h} (x:${x0}-${x1} y:${y0}-${y1}) → ${OUT} ${SIZE}x${SIZE} (${scale} 倍)`)
