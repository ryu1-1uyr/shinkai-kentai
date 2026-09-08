import { DEFAULT_CONFIG } from '../game/config.ts'
import { MUTATION_BY_ID, type MutationId } from '../game/mutations.ts'
import { simulate } from './run.ts'

const N = 60
type Row = { seed: number; depth: number; ep: number; hasLegend: boolean; hasRare: boolean; ranks: string }
const results: Row[] = []
for (let seed = 1; seed <= N; seed++) {
  const r = simulate({ seed, draft: 'greedyEV', cfg: DEFAULT_CONFIG })
  const ids = r.ranks.split(' ').filter(Boolean)
  const hasLegend = ids.some((t) => t.startsWith('エイリアン') || t.startsWith('宇宙化'))
  const hasRare = ids.some((t) => t.startsWith('機械化') || t.startsWith('帯電化'))
  results.push({ seed, depth: r.clearedDepth, ep: r.expPower, hasLegend, hasRare, ranks: r.ranks })
}

const depths = results.map((r) => r.depth)
const mean = depths.reduce((a, b) => a + b, 0) / N
const sd = Math.sqrt(depths.reduce((a, b) => a + (b - mean) ** 2, 0) / N)

console.log(`\n=== ${N} シードの到達深度分布（greedyEV / 恒久強化なし） ===\n`)
const hist = new Map<number, number>()
for (const d of depths) hist.set(d, (hist.get(d) ?? 0) + 1)
for (const d of [...hist.keys()].sort((a, b) => a - b)) {
  console.log(`  深度 ${String(d).padStart(2)} : ${'#'.repeat(hist.get(d)!)} (${hist.get(d)})`)
}
console.log(
  `\n  平均 ${mean.toFixed(2)}  標準偏差 ${sd.toFixed(2)}  レンジ ${Math.min(...depths)}〜${Math.max(...depths)}`,
)

const legend = results.filter((r) => r.hasLegend)
const rare = results.filter((r) => !r.hasLegend && r.hasRare)
const none = results.filter((r) => !r.hasLegend && !r.hasRare)
const avg = (xs: Row[]) => (xs.length ? (xs.reduce((a, b) => a + b.depth, 0) / xs.length).toFixed(2) : '-')

console.log('\n=== 引いたレア度別の到達深度 ===\n')
console.log(`  レジェンダリーを引いた   ${String(legend.length).padStart(2)} 回 / 平均深度 ${avg(legend)}`)
console.log(`  レアどまり               ${String(rare.length).padStart(2)} 回 / 平均深度 ${avg(rare)}`)
console.log(`  アンコモン以下           ${String(none.length).padStart(2)} 回 / 平均深度 ${avg(none)}`)

console.log('\n=== 上振れ / 下振れの実例 ===\n')
const sorted = [...results].sort((a, b) => b.depth - a.depth)
for (const r of [sorted[0], sorted[1], sorted[sorted.length - 2], sorted[sorted.length - 1]]) {
  console.log(`  深度 ${String(r.depth).padStart(2)}  E[pw] ${r.ep.toFixed(0).padStart(7)}   ${r.ranks}`)
}
void MUTATION_BY_ID
void (0 as unknown as MutationId)
