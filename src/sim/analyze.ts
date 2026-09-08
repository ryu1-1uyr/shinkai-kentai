import { DEFAULT_CONFIG, withConfig } from '../game/config.ts'
import { expectedPower } from '../game/mutations.ts'
import { simulate } from './run.ts'

function fmt(n: number): string {
  if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B'
  if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M'
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'k'
  return n.toFixed(1)
}
function mmss(sec: number): string {
  return `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}`
}

console.log('\n=== A. rankPowerMult 微調整: 重ね取りと分散の期待戦闘力比（レア度導入後） ===\n')
console.log('mult   stackE     spreadE    比(stack/spread)   stack突破 spread突破')
for (const mult of [1.0, 1.1, 1.2, 1.3, 1.4, 1.5, 1.8, 2.5]) {
  const cfg = withConfig(DEFAULT_CONFIG, { mutation: { rankPowerMult: mult } })
  const a = simulate({ cfg, draft: 'stack' })
  const b = simulate({ cfg, draft: 'spread' })
  const ratio = a.expPower / b.expPower
  const mark = ratio > 1.3 ? '  ← 重ね取り有利' : ratio < 0.77 ? '  ← 分散有利' : '  ← 拮抗'
  console.log(
    `${mult.toFixed(1).padStart(4)}  ${fmt(a.expPower).padStart(8)}  ${fmt(b.expPower).padStart(9)}  ` +
      `${ratio.toFixed(2).padStart(10)}${mark.padEnd(18)}` +
      `${String(a.clearedDepth).padStart(5)} ${String(b.clearedDepth).padStart(7)}`,
  )
}

console.log('\n=== B. hpGrowth 微調整: 初回ランの到達深度と総時間 ===\n')
console.log('growth  突破深度  総時間   戦果')
for (const g of [1.8, 2.0, 2.2, 2.5, 3.0, 3.5, 4.0, 5.0, 6.5]) {
  const cfg = withConfig(DEFAULT_CONFIG, { targets: { hpGrowth: g } })
  const r = simulate({ cfg, draft: 'greedyEV' })
  console.log(
    `${g.toFixed(1).padStart(5)}   ${String(r.clearedDepth).padStart(6)}   ${mmss(r.totalSeconds).padStart(6)}   ${fmt(r.score)}`,
  )
}

console.log('\n=== C. メタ進行の伸びしろ: 恒久強化を basePower 倍率で近似 ===\n')
console.log('（hpGrowth ごとに、恒久強化がどれだけ深度を伸ばせるか）\n')
const metas = [1, 3, 10, 30, 100, 1000, 1e4, 1e6]
process.stdout.write('growth |')
for (const m of metas) process.stdout.write(` x${String(fmt(m)).padStart(6)}`)
console.log('\n-------|' + '-'.repeat(metas.length * 8))
for (const g of [2.2, 3.0, 4.0, 6.5]) {
  process.stdout.write(`${g.toFixed(1).padStart(6)} |`)
  for (const m of metas) {
    const cfg = withConfig(DEFAULT_CONFIG, {
      targets: { hpGrowth: g },
      shark: { basePower: m, cultureCost: DEFAULT_CONFIG.shark.cultureCost },
    })
    const r = simulate({ cfg, draft: 'greedyEV' })
    process.stdout.write(`${String(r.clearedDepth).padStart(7)} `)
  }
  console.log()
}

console.log('\n=== D. ラン総時間の分布（runWide vs perDepth） ===\n')
console.log('到達深度に対して総時間がどう伸びるか')
console.log('growth  model      突破  総時間')
for (const g of [2.2, 3.0, 6.5]) {
  for (const model of ['runWide', 'perDepth'] as const) {
    const cfg = withConfig(DEFAULT_CONFIG, { targets: { hpGrowth: g }, invasion: { timerModel: model } })
    const r = simulate({ cfg, draft: 'greedyEV' })
    console.log(
      `${g.toFixed(1).padStart(5)}   ${model.padEnd(9)}  ${String(r.clearedDepth).padStart(4)}  ${mmss(r.totalSeconds).padStart(6)}`,
    )
  }
}
void expectedPower
