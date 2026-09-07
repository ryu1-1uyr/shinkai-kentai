import type { Config } from './config.ts'
import { type Family, FAMILIES } from './mutations.ts'

/**
 * 恒久強化。ラン終了時に得た研究予算で買い、次のラン以降に永続する。
 *
 * 3 系統に分ける。
 *   数値強化   … レベル制。コストが等比で伸びる
 *   系統解禁   … 買い切り。ドラフトに出る変異が増える（ローグライトとしての主軸）
 *   利便性     … 買い切り。倍速や自動化
 */

export type MetaState = {
  /** 未使用の研究予算 */
  budget: number
  /** 累計獲得（実績表示用） */
  lifetimeBudget: number
  runs: number
  bestDepth: number
  /** 数値強化のレベル */
  levels: Record<string, number>
  /** 買い切りで取得済みの ID */
  unlocked: string[]
}

export function createMeta(): MetaState {
  return { budget: 0, lifetimeBudget: 0, runs: 0, bestDepth: 0, levels: {}, unlocked: [] }
}

// ---------------------------------------------------------------------------
// 数値強化
// ---------------------------------------------------------------------------

export type NumericUpgrade = {
  id: string
  name: string
  /** レベル lv のときの効果説明 */
  detail: (lv: number) => string
  baseCost: number
  costGrowth: number
  maxLevel: number
}

export const NUMERIC_UPGRADES: NumericUpgrade[] = [
  {
    id: 'clickPower',
    name: 'クリック増幅',
    detail: (lv) => `培養液の手動採取 ×${(1 + 0.3 * lv).toFixed(1)}`,
    baseCost: 20,
    costGrowth: 1.9,
    maxLevel: 20,
  },
  {
    id: 'startTanks',
    name: '培養槽の常設',
    detail: (lv) => `開始時に培養槽を ${lv} 個持つ`,
    baseCost: 30,
    costGrowth: 2.2,
    maxLevel: 12,
  },
  {
    id: 'cultureRate',
    name: '培養液生産',
    detail: (lv) => `培養液の自動生産 ×${(1 + 0.25 * lv).toFixed(2)}`,
    baseCost: 40,
    costGrowth: 2.0,
    maxLevel: 20,
  },
  {
    id: 'sharkRate',
    name: '繁殖効率',
    detail: (lv) => `検体の生産速度 ×${(1 + 0.25 * lv).toFixed(2)}`,
    baseCost: 60,
    costGrowth: 2.0,
    maxLevel: 20,
  },
  {
    id: 'startSharks',
    name: '検体の備蓄',
    detail: (lv) => `開始時に検体を ${lv * 25} 体持つ`,
    baseCost: 80,
    costGrowth: 2.3,
    maxLevel: 15,
  },
  {
    id: 'launchRate',
    name: '射出機構',
    detail: (lv) => `投入速度 ×${(1 + 0.2 * lv).toFixed(2)}`,
    baseCost: 120,
    costGrowth: 2.1,
    maxLevel: 15,
  },
  {
    id: 'sharkPower',
    name: '基礎戦闘力',
    detail: (lv) => `全検体の戦闘力 ×${(1 + 0.4 * lv).toFixed(1)}`,
    baseCost: 200,
    costGrowth: 2.6,
    maxLevel: 25,
  },
]

export const NUMERIC_BY_ID = new Map(NUMERIC_UPGRADES.map((u) => [u.id, u]))

export function upgradeCost(u: NumericUpgrade, level: number): number {
  return Math.floor(u.baseCost * Math.pow(u.costGrowth, level))
}

// ---------------------------------------------------------------------------
// 買い切り（系統解禁 / 利便性）
// ---------------------------------------------------------------------------

export type UnlockDef = {
  id: string
  name: string
  detail: string
  cost: number
  kind: 'family' | 'qol' | 'unique'
  family?: Family
  /** これを買っていないと解禁されない */
  requires?: string
}

export const UNLOCKS: UnlockDef[] = [
  {
    id: 'family_abyss',
    name: `${FAMILIES.abyss.name}の解禁`,
    detail: '高圧適応・深淵種・触手化・古代神性がドラフトに追加される',
    cost: 500,
    kind: 'family',
    family: 'abyss',
  },
  {
    id: 'family_mech',
    name: `${FAMILIES.mech.name}の解禁`,
    detail: '装甲化・機械化・帯電化・自律兵装がドラフトに追加される',
    cost: 2500,
    kind: 'family',
    family: 'mech',
    requires: 'family_abyss',
  },
  {
    id: 'family_cosmic',
    name: `${FAMILIES.cosmic.name}の解禁`,
    detail: '無重力・隕石化・宇宙化・エイリアンがドラフトに追加される',
    cost: 15000,
    kind: 'family',
    family: 'cosmic',
    requires: 'family_mech',
  },
  { id: 'speed2', name: '倍速 ×2', detail: '実験の進行を 2 倍速にできる', cost: 300, kind: 'qol' },
  {
    id: 'doubleClick',
    name: 'ダブルクリック',
    detail: '手動採取で得られる培養液が 2 倍になる',
    cost: 700,
    kind: 'unique',
  },
  {
    id: 'autoBuyOne',
    name: '定期発注',
    detail: '設備を 1 種類だけ選んで自動購入できる（選び直しは自由）',
    cost: 1200,
    kind: 'qol',
  },
  {
    id: 'feederSynergy',
    name: '給餌連動',
    detail: '給餌装置 1 個につき培養液の生産 +3%',
    cost: 1800,
    kind: 'unique',
  },
  {
    id: 'autoClick',
    name: '自動採取装置',
    detail: '毎秒 5 回ぶんの培養液を自動で採取する',
    cost: 900,
    kind: 'qol',
  },
  { id: 'speed4', name: '倍速 ×4', detail: '実験の進行を 4 倍速にできる', cost: 2000, kind: 'qol', requires: 'speed2' },
  {
    id: 'autoBuyAll',
    name: 'AI 発注',
    detail: '買える設備をすべて自動で購入する（オン / オフ切り替え可）',
    cost: 12000,
    kind: 'qol',
    requires: 'autoBuyOne',
  },
]

export const UNLOCK_BY_ID = new Map(UNLOCKS.map((u) => [u.id, u]))

// ---------------------------------------------------------------------------
// 効果の集計
// ---------------------------------------------------------------------------

export type MetaEffects = {
  startTanks: number
  startSharks: number
  clickMult: number
  cultureMult: number
  sharkRateMult: number
  launchMult: number
  powerMult: number
  families: Set<Family>
  maxSpeed: 1 | 2 | 4
  /** 設備を 1 種類だけ自動購入できる */
  autoBuyOne: boolean
  /** 買える設備をすべて自動購入する */
  autoBuyAll: boolean
  /** 毎秒の自動クリック回数 */
  autoClick: number
  /** 給餌装置の数に応じて培養液生産が伸びる。建物数に依存するため tick 側で適用する */
  feederSynergy: boolean
}

export function metaEffects(m: MetaState): MetaEffects {
  const lv = (id: string) => m.levels[id] ?? 0
  const has = (id: string) => m.unlocked.includes(id)

  const families = new Set<Family>()
  for (const [id, f] of Object.entries(FAMILIES)) {
    if (f.initial) families.add(id as Family)
  }
  for (const u of UNLOCKS) {
    if (u.kind === 'family' && u.family && has(u.id)) families.add(u.family)
  }

  return {
    startTanks: lv('startTanks'),
    startSharks: lv('startSharks') * 25,
    clickMult: (1 + 0.3 * lv('clickPower')) * (has('doubleClick') ? 2 : 1),
    cultureMult: 1 + 0.25 * lv('cultureRate'),
    sharkRateMult: 1 + 0.25 * lv('sharkRate'),
    launchMult: 1 + 0.2 * lv('launchRate'),
    powerMult: 1 + 0.4 * lv('sharkPower'),
    families,
    maxSpeed: has('speed4') ? 4 : has('speed2') ? 2 : 1,
    autoBuyOne: has('autoBuyOne'),
    autoBuyAll: has('autoBuyAll'),
    autoClick: has('autoClick') ? 5 : 0,
    feederSynergy: has('feederSynergy'),
  }
}

/** 基礎戦闘力の倍率は Config に焼き込む。これで戦闘力の計算式を触らずに済む */
export function applyMetaToConfig(cfg: Config, e: MetaEffects): Config {
  return { ...cfg, shark: { ...cfg.shark, basePower: cfg.shark.basePower * e.powerMult } }
}

// ---------------------------------------------------------------------------
// 報酬
// ---------------------------------------------------------------------------

/**
 * ラン終了時の研究予算。
 *
 * 総戦果は hpGrowth に引きずられて深度ごとに約 5 倍になるため、
 * そのまま比例させると深度 1 つで収入が 5 倍になってインフレする。
 * 平方根で潰したうえで、到達深度ボーナスを乗算で乗せる。
 *
 * 係数 0.3 は実測で決めた。連続プレイのシミュレータで掃引したところ、
 * 0.1 では深度 2 に届くまで 13 ラン、0.8 では 3 ラン（進行が速すぎる）となり、
 * 0.3 で「初回は深度 1、3 ラン目で深度 2」に収まった。
 */
export const BUDGET_COEF = 0.3

export function budgetFor(score: number, clearedDepth: number): number {
  if (score <= 0) return 0
  return Math.floor(Math.sqrt(score) * BUDGET_COEF * (1 + 0.5 * clearedDepth))
}

// ---------------------------------------------------------------------------
// 購入
// ---------------------------------------------------------------------------

export function canBuyNumeric(m: MetaState, id: string): boolean {
  const u = NUMERIC_BY_ID.get(id)
  if (!u) return false
  const lv = m.levels[id] ?? 0
  return lv < u.maxLevel && m.budget >= upgradeCost(u, lv)
}

export function buyNumeric(m: MetaState, id: string): boolean {
  if (!canBuyNumeric(m, id)) return false
  const u = NUMERIC_BY_ID.get(id)!
  const lv = m.levels[id] ?? 0
  m.budget -= upgradeCost(u, lv)
  m.levels[id] = lv + 1
  return true
}

export function unlockAvailable(m: MetaState, u: UnlockDef): boolean {
  if (m.unlocked.includes(u.id)) return false
  if (u.requires && !m.unlocked.includes(u.requires)) return false
  return true
}

export function buyUnlock(m: MetaState, id: string): boolean {
  const u = UNLOCK_BY_ID.get(id)
  if (!u || !unlockAvailable(m, u) || m.budget < u.cost) return false
  m.budget -= u.cost
  m.unlocked.push(u.id)
  return true
}
