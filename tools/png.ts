import { deflateSync } from 'node:zlib'
import { writeFileSync } from 'node:fs'

/**
 * 最小限の PNG 書き出し。
 * 外部ライブラリを使わずに RGBA のピクセル配列から PNG ファイルを作る。
 * 生成したスプライトを編集ソフトで開ける形で残すために使う。
 */

const CRC_TABLE = (() => {
  const t = new Int32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c
  }
  return t
})()

function crc32(buf: Uint8Array): number {
  let c = -1
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ -1) >>> 0
}

function chunk(type: string, data: Uint8Array): Buffer {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), Buffer.from(data)])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body), 0)
  return Buffer.concat([len, body, crc])
}

/** rgba は width*height*4 バイト（R,G,B,A の順） */
export function encodePng(width: number, height: number, rgba: Uint8Array): Buffer {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // color type: RGBA
  ihdr[10] = 0 // compression
  ihdr[11] = 0 // filter
  ihdr[12] = 0 // interlace

  // 各行の先頭にフィルタ種別 0 を付ける
  const raw = Buffer.alloc(height * (1 + width * 4))
  for (let y = 0; y < height; y++) {
    const dst = y * (1 + width * 4)
    raw[dst] = 0
    Buffer.from(rgba.buffer, rgba.byteOffset + y * width * 4, width * 4).copy(raw, dst + 1)
  }

  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', new Uint8Array(0)),
  ])
}

export function writePng(path: string, width: number, height: number, rgba: Uint8Array): void {
  writeFileSync(path, encodePng(width, height, rgba))
}

// ---------------------------------------------------------------------------
// 読み込み
// ---------------------------------------------------------------------------

import { inflateSync } from 'node:zlib'
import { readFileSync } from 'node:fs'

export type Decoded = { width: number; height: number; rgba: Uint8Array }

function paeth(a: number, b: number, c: number): number {
  const p = a + b - c
  const pa = Math.abs(p - a)
  const pb = Math.abs(p - b)
  const pc = Math.abs(p - c)
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c
}

/** PNG を RGBA に展開する。カラータイプ 0/2/3/6 と 8bit 深度に対応 */
export function decodePng(path: string): Decoded {
  const buf = readFileSync(path)
  let pos = 8
  let width = 0
  let height = 0
  let colorType = 0
  let bitDepth = 8
  const idat: Buffer[] = []
  let plte: Buffer | null = null
  let trns: Buffer | null = null

  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos)
    const type = buf.toString('ascii', pos + 4, pos + 8)
    const data = buf.subarray(pos + 8, pos + 8 + len)
    if (type === 'IHDR') {
      width = data.readUInt32BE(0)
      height = data.readUInt32BE(4)
      bitDepth = data[8]
      colorType = data[9]
    } else if (type === 'PLTE') plte = Buffer.from(data)
    else if (type === 'tRNS') trns = Buffer.from(data)
    else if (type === 'IDAT') idat.push(Buffer.from(data))
    else if (type === 'IEND') break
    pos += 12 + len
  }
  if (bitDepth !== 8) throw new Error(`bit depth ${bitDepth} は未対応`)

  const channels = colorType === 6 ? 4 : colorType === 2 ? 3 : colorType === 4 ? 2 : 1
  const stride = width * channels
  const raw = inflateSync(Buffer.concat(idat))
  const lines = Buffer.alloc(height * stride)

  // 行ごとのフィルタを解除する
  for (let y = 0; y < height; y++) {
    const ft = raw[y * (stride + 1)]
    const src = raw.subarray(y * (stride + 1) + 1, y * (stride + 1) + 1 + stride)
    const dst = lines.subarray(y * stride, (y + 1) * stride)
    const up = y > 0 ? lines.subarray((y - 1) * stride, y * stride) : null
    for (let i = 0; i < stride; i++) {
      const a = i >= channels ? dst[i - channels] : 0
      const b = up ? up[i] : 0
      const c = up && i >= channels ? up[i - channels] : 0
      let v = src[i]
      if (ft === 1) v += a
      else if (ft === 2) v += b
      else if (ft === 3) v += (a + b) >> 1
      else if (ft === 4) v += paeth(a, b, c)
      dst[i] = v & 0xff
    }
  }

  const rgba = new Uint8Array(width * height * 4)
  for (let p = 0; p < width * height; p++) {
    const s = p * channels
    const t = p * 4
    if (colorType === 3) {
      const idx = lines[s]
      rgba[t] = plte![idx * 3]
      rgba[t + 1] = plte![idx * 3 + 1]
      rgba[t + 2] = plte![idx * 3 + 2]
      rgba[t + 3] = trns && idx < trns.length ? trns[idx] : 255
    } else if (colorType === 6) {
      rgba[t] = lines[s]; rgba[t + 1] = lines[s + 1]; rgba[t + 2] = lines[s + 2]; rgba[t + 3] = lines[s + 3]
    } else if (colorType === 2) {
      rgba[t] = lines[s]; rgba[t + 1] = lines[s + 1]; rgba[t + 2] = lines[s + 2]; rgba[t + 3] = 255
    } else if (colorType === 0) {
      rgba[t] = rgba[t + 1] = rgba[t + 2] = lines[s]; rgba[t + 3] = 255
    } else {
      rgba[t] = rgba[t + 1] = rgba[t + 2] = lines[s]; rgba[t + 3] = lines[s + 1]
    }
  }
  return { width, height, rgba }
}
