import { DEFAULT_CONFIG, withConfig } from '../game/config.ts'
import { simulate } from './run.ts'

/**
 * 「運が悪かったラン」を重ね取りで救済できているかを測る。
 * rankPowerMult を上げると、レアを引けなかったランでもコモンを育てて戦えるようになるはず。
 */
const N = 60
console.log('\n=== rankPowerMult と「運の格差」 ===\n')
console.log('mult   全体平均  レジェあり  レアどまり  ﾚｱなし   格差(レジェ-ﾚｱなし)  SD')
for (const mult of [1.2, 2.0, 2.5, 3.0, 4.0, 5.0]) {
  const cfg = withConfig(DEFAULT_CONFIG, { mutation: { rankPowerMult: mult } })
  type Row = { d: number; tier: number }
  const rows: Row[] = []
  for (let seed = 1; seed <= N; seed++) {
    const r = simulate({ seed, draft: 'greedyEV', cfg })
    const t = r.ranks
    const legend = t.includes('エイリアン') || t.includes('宇宙化')
    const rare = t.includes('機械化') || t.includes('帯電化')
    rows.push({ d: r.clearedDepth, tier: legend ? 2 : rare ? 1 : 0 })
  }
  const avg = (f: (x: Row) => boolean) => {
    const xs = rows.filter(f)
    return xs.length ? xs.reduce((a, b) => a + b.d, 0) / xs.length : NaN
  }
  const all = rows.reduce((a, b) => a + b.d, 0) / N
  const sd = Math.sqrt(rows.reduce((a, b) => a + (b.d - all) ** 2, 0) / N)
  const hi = avg((x) => x.tier === 2)
  const mid = avg((x) => x.tier === 1)
  const lo = avg((x) => x.tier === 0)
  const gap = hi - lo
  console.log(
    `${mult.toFixed(1).padStart(4)}   ${all.toFixed(2).padStart(7)}   ${(hi || 0).toFixed(2).padStart(8)}   ` +
      `${(mid || 0).toFixed(2).padStart(8)}  ${(lo || 0).toFixed(2).padStart(6)}   ` +
      `${(isNaN(gap) ? 0 : gap).toFixed(2).padStart(14)}   ${sd.toFixed(2)}`,
  )
}
