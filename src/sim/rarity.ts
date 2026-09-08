import { DEFAULT_CONFIG } from '../game/config.ts'
import { MUTATIONS, type MutationId, offerWeight, RARITY } from '../game/mutations.ts'
import { mutationName } from '../game/mutations.ts'

const cfg = DEFAULT_CONFIG

/** 生産数 P のときに 3 枚のドラフトへ各変異が現れる確率をモンテカルロで測る */
function appearRates(produced: number, trials = 200000): Map<MutationId, number> {
  const hit = new Map<MutationId, number>()
  for (const m of MUTATIONS) hit.set(m.id, 0)
  for (let t = 0; t < trials; t++) {
    const picked = new Set<MutationId>()
    for (let k = 0; k < cfg.mutation.draftSize; k++) {
      const avail = MUTATIONS.filter((m) => !picked.has(m.id))
      let total = 0
      for (const m of avail) total += offerWeight(m, produced)
      if (total <= 0) break
      let r = Math.random() * total
      for (const m of avail) {
        r -= offerWeight(m, produced)
        if (r <= 0) {
          picked.add(m.id)
          break
        }
      }
    }
    for (const id of picked) hit.set(id, (hit.get(id) ?? 0) + 1)
  }
  const out = new Map<MutationId, number>()
  for (const [id, n] of hit) out.set(id, n / trials)
  return out
}

const levels = [10, 50, 200, 600, 1000, 3000, 10000]

console.log('\n=== ドラフト 1 回に各変異が現れる確率（3 枚提示） ===\n')
process.stdout.write('変異          レア度      ')
for (const p of levels) process.stdout.write(`P=${String(p).padStart(5)} `)
console.log('\n' + '-'.repeat(30 + levels.length * 8))

const rows = levels.map((p) => appearRates(p))
for (const m of MUTATIONS) {
  process.stdout.write(`${mutationName(m).padEnd(12)}  ${m.rarity.padEnd(10)}  `)
  rows.forEach((r) => {
    const v = (r.get(m.id) ?? 0) * 100
    process.stdout.write(`${(v < 1 ? v.toFixed(2) : v.toFixed(1)).padStart(6)}% `)
  })
  console.log()
}

console.log('\n=== レア度ごとの重み設定 ===\n')
for (const [name, r] of Object.entries(RARITY)) {
  console.log(`  ${name.padEnd(10)} weight ${r.weight.toFixed(2)}  scale ${String(r.scale).padStart(5)}`)
}
