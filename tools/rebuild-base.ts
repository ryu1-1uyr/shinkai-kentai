import { decodePng, writePng } from './png.ts'

/**
 * 取り込んだ base.png をドット絵として使える形に戻す。
 *
 * 背景の切り抜き時に非整数倍のリサンプルが挟まっており、
 *   - 本来 7 色のはずが 255 色に散っている
 *   - 全ピクセルの alpha が 254（完全不透明が 1 つも無い）
 *   - 1 ドット幅の輪郭線が 18〜20px にばらついて格子が消えている
 * という状態になっている。
 *
 * パレットに量子化したうえで、区画の最頻色を取ってダウンサンプルする。
 * 格子がずれていても最頻色なら影響を受けにくい。
 */

const PALETTE: Array<[number, number, number]> = [
  [5, 6, 38], // 輪郭の紺
  [31, 36, 52], // 暗部
  [76, 84, 94], // 影
  [103, 112, 121], // 体のグレー（主）
  [139, 148, 157], // ハイライト
  [163, 172, 179], // 中間
  [200, 207, 212], // 腹の明色
]

const src = decodePng(process.env.SRC ?? 'art-src/base.png')

/** 各画素をパレット番号に落とす。透明は -1 */
function quantize(d: typeof src): Int8Array {
  const q = new Int8Array(d.width * d.height)
  for (let p = 0; p < d.width * d.height; p++) {
    const i = p * 4
    if (d.rgba[i + 3] < 128) {
      q[p] = -1
      continue
    }
    let best = 0
    let bd = Infinity
    for (let k = 0; k < PALETTE.length; k++) {
      const dr = PALETTE[k][0] - d.rgba[i]
      const dg = PALETTE[k][1] - d.rgba[i + 1]
      const db = PALETTE[k][2] - d.rgba[i + 2]
      const v = dr * dr + dg * dg + db * db
      if (v < bd) {
        bd = v
        best = k
      }
    }
    q[p] = best
  }
  return q
}

const q = quantize(src)

// 不透明部分の外接矩形
let x0 = src.width,
  y0 = src.height,
  x1 = -1,
  y1 = -1
for (let y = 0; y < src.height; y++) {
  for (let x = 0; x < src.width; x++) {
    if (q[y * src.width + x] < 0) continue
    if (x < x0) x0 = x
    if (x > x1) x1 = x
    if (y < y0) y0 = y
    if (y > y1) y1 = y
  }
}
const bw = x1 - x0 + 1
const bh = y1 - y0 + 1

console.log(`元画像      ${src.width}×${src.height}`)
console.log(`外接矩形    ${bw}×${bh}  (x:${x0}〜${x1} / y:${y0}〜${y1})`)

// 輪郭線（パレット 0）の水平方向の連続長から 1 ドットの大きさを推定
const runs = new Map<number, number>()
for (let y = y0; y <= y1; y++) {
  let n = 0
  for (let x = x0; x <= x1; x++) {
    if (q[y * src.width + x] === 0) n++
    else {
      if (n > 0 && n < 60) runs.set(n, (runs.get(n) ?? 0) + 1)
      n = 0
    }
  }
}
const top = [...runs.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)
const dot = top[0][0]
console.log(`輪郭の太さ  ${top.map(([k, v]) => `${k}px×${v}`).join(' / ')}  → 1 ドット ≈ ${dot}px`)
console.log(`推定ドット数 ${(bw / dot).toFixed(1)} × ${(bh / dot).toFixed(1)}`)

const dist = new Array(PALETTE.length).fill(0)
let clearN = 0
for (let i = 0; i < q.length; i++) q[i] < 0 ? clearN++ : dist[q[i]]++
console.log('色の分布   ' + dist.map((n, i) => `#${i}:${(n / 1000).toFixed(0)}k`).join(' '))

/** 区画の最頻色でダウンサンプルする */
function downsample(tw: number, th: number): Uint8Array {
  const out = new Uint8Array(tw * th * 4)
  for (let ty = 0; ty < th; ty++) {
    for (let tx = 0; tx < tw; tx++) {
      // 区画は元画像の絶対座標で取る（相対値と混ぜないよう注意）
      const rx0 = Math.floor((tx * bw) / tw)
      const ry0 = Math.floor((ty * bh) / th)
      const sx0 = x0 + rx0
      const sx1 = x0 + Math.max(rx0 + 1, Math.floor(((tx + 1) * bw) / tw))
      const sy0 = y0 + ry0
      const sy1 = y0 + Math.max(ry0 + 1, Math.floor(((ty + 1) * bh) / th))
      const votes = new Map<number, number>()
      for (let y = sy0; y < sy1; y++)
        for (let x = sx0; x < sx1; x++) {
          const v = q[y * src.width + x]
          votes.set(v, (votes.get(v) ?? 0) + 1)
        }
      let best = -1,
        bn = -1
      for (const [v, n] of votes)
        if (n > bn) {
          bn = n
          best = v
        }
      const t = (ty * tw + tx) * 4
      if (best < 0) {
        out[t + 3] = 0
        continue
      }
      out[t] = PALETTE[best][0]
      out[t + 1] = PALETTE[best][1]
      out[t + 2] = PALETTE[best][2]
      out[t + 3] = 255
    }
  }
  return out
}

/**
 * 書き出し。
 * art-src/ に置かれた「絵として描いたファイル」を入力に、
 * public/sprites/ にゲームが読む版を生成する。
 * 拡大縮小は整数倍だけで済むよう、必要なサイズをここで作っておく。
 */
const targets = process.argv.slice(2).length
  ? process.argv.slice(2).map((s) => s.split('x').map(Number) as [number, number])
  : ([[96, 44]] as Array<[number, number]>)

console.log('')
for (const [tw, th] of targets) {
  const px = downsample(tw, th)
  const path = process.argv.slice(2).length
    ? `public/sprites/_rebuild_${tw}x${th}.png`
    : 'public/sprites/base.png'
  writePng(path, tw, th, px)
  console.log(`書き出し    ${path}  (${tw}×${th})`)
}
