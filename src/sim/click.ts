/**
 * 手動採取と自動生産の取り分を比べる。
 * 「能動的に叩くほうが自動より少し割が良い」状態を保てているかの確認用。
 */
import { autoBuy, BUY_RATIOS, makeDraftChooser, pickPolicy } from './policy.ts'
import { DEFAULT_CONFIG } from '../game/config.ts'
import { createMeta, metaEffects, buyNumeric } from '../game/meta.ts'
import { createState } from '../game/state.ts'
import { applyDraft, clickEV, clickValue, cultureRate, tick } from '../game/tick.ts'

const CPS = 5

function run(critLv: number, powerLv: number, base: Record<string, number>, unlocks: string[]) {
  const m = createMeta()
  m.levels = { ...base, critChance: critLv, critPower: powerLv }
  m.unlocked = [...unlocks]
  const cfg = DEFAULT_CONFIG
  const s = createState(cfg, 7, metaEffects(m))
  const dt = 1 / cfg.tickHz
  const chooser = makeDraftChooser('greedyEV')
  let manual = 0
  let auto = 0
  const marks = new Map<number, number>()
  while (s.phase !== 'over' && s.t < 180) {
    manual += clickEV(s, cfg) * CPS * dt
    auto += cultureRate(s) * dt
    tick(s, { clicksPerSec: CPS }, cfg)
    if (s.pendingDraft) {
      const d = s.pendingDraft
      applyDraft(s, cfg, d.kind === 'mutation' ? chooser(d.offers, s, cfg) : pickPolicy(d.offers))
    }
    if (Math.round(s.t / dt) % cfg.tickHz === 0)
      autoBuy(s, cfg, BUY_RATIOS.balanced, cultureRate(s) + clickEV(s, cfg) * CPS)
    for (const t of [15, 30, 60, 120]) {
      if (!marks.has(t) && s.t >= t) marks.set(t, (manual / (manual + auto)) * 100)
    }
  }
  const ev = clickEV(s, cfg) / clickValue(s, cfg)
  return {
    share: (manual / (manual + auto)) * 100,
    ev,
    marks: [15, 30, 60, 120].map((t) => `${t}s:${(marks.get(t) ?? 0).toFixed(0)}%`).join(' '),
  }
}

/** 会心以外を出し切った状態。ここで比べないと自動側に不利すぎる */
const MAXED = {
  clickPower: 20,
  cultureRate: 20,
  startTanks: 12,
  sharkRate: 20,
  startSharks: 15,
  launchRate: 15,
  sharkPower: 20,
}
const MAX_UNLOCKS = ['doubleClick', 'tankSynergy', 'feederSynergy', 'breederSynergy', 'launcherSynergy']

console.log('\n=== 培養液の出どころ（手動 5 クリック/秒 と仮定）===\n')
for (const [label, base, unlocks] of [
  ['素の状態', {}, []],
  ['会心以外を出し切った状態', MAXED, MAX_UNLOCKS],
] as const) {
  console.log(`\n--- ${label} ---`)
  console.log('会心率Lv 会心倍率Lv  会心EV  手動の取り分（経過時点別）        総取り分')
  for (const [c, p] of [[0, 0], [3, 3], [6, 4], [10, 10]] as const) {
    const r = run(c, p, base as Record<string, number>, unlocks as string[])
    console.log(
      `${String(c).padStart(6)} ${String(p).padStart(10)}  ×${r.ev.toFixed(2)}  ` +
        `${r.marks.padEnd(34)} ${r.share.toFixed(1).padStart(6)}%`,
    )
  }
}
