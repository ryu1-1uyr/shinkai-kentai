import type { Config } from './config.ts'
import { type Family, FAMILIES, type MutationId } from './mutations.ts'

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
    id: 'critChance',
    name: '採取の勘',
    detail: (lv) => `手動採取の ${5 * lv}% が会心になる`,
    baseCost: 120,
    costGrowth: 1.9,
    maxLevel: 10,
  },
  {
    id: 'critPower',
    name: '一点集中',
    detail: (lv) => `会心した採取が ×${(2 + 0.7 * lv).toFixed(1)}`,
    baseCost: 400,
    costGrowth: 2.0,
    maxLevel: 10,
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
  {
    id: 'family_disaster',
    name: `${FAMILIES.disaster.name}の解禁`,
    detail: '竜巻化・灼熱・氷結・暴風・大津波がドラフトに追加される',
    cost: 40000,
    kind: 'family',
    family: 'disaster',
    requires: 'family_cosmic',
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
    id: 'reroll',
    name: '再実験',
    detail: 'ドラフトを 1 ラン に 1 回だけ引き直せる',
    cost: 1500,
    kind: 'unique',
  },
  {
    id: 'earlyDraft',
    name: '早期実験',
    detail: '最初のドラフトが累計 10 体で訪れる（通常は 50 体）',
    cost: 2200,
    kind: 'unique',
  },
  {
    id: 'lastStand',
    name: '緊急浮上',
    detail: 'ラン終了時、在庫の検体をすべて投入してから終わる',
    cost: 2800,
    kind: 'unique',
  },
  {
    id: 'reservePower',
    name: '予備電源',
    detail: '制限時間が尽きた瞬間、1 ラン に 1 回だけ +20 秒',
    cost: 4000,
    kind: 'unique',
  },
  {
    id: 'extraOffer',
    name: '追加検体枠',
    detail: 'ドラフトの提示が 3 枚から 4 枚になる',
    cost: 5000,
    kind: 'unique',
  },
  {
    id: 'chainCollapse',
    name: '連鎖崩壊',
    detail: '建物を破壊した際の余剰ダメージが、次の建物に 2 倍で通る',
    cost: 7000,
    kind: 'unique',
  },
  {
    id: 'prototype',
    name: '試作認可',
    detail: '突然変異のランク上限が 3 から 4 になる',
    cost: 20000,
    kind: 'unique',
  },
  {
    id: 'tankSynergy',
    name: '温度管理',
    detail: '培養槽 1 個につき培養液の生産 +2%',
    cost: 1000,
    kind: 'unique',
  },
  {
    id: 'feederSynergy',
    name: '給餌連動',
    detail: '給餌装置 1 個につき培養液の生産 +3%',
    cost: 1800,
    kind: 'unique',
  },
  {
    id: 'breederSynergy',
    name: '過密飼育',
    detail: '繁殖槽 1 個につき検体の生産速度 +2%',
    cost: 2600,
    kind: 'unique',
  },
  {
    id: 'launcherSynergy',
    name: '射出斉射',
    detail: '射出管 1 個につき投入速度 +3%',
    cost: 3600,
    kind: 'unique',
  },
  {
    id: 'autoClick',
    name: '自動採取装置',
    detail: '毎秒 5 回ぶんの培養液を自動で採取する（会心はしない）',
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
  /** 手動採取が会心する確率。研究方針「過剰採取」と加算される */
  critChance: number
  /** 会心したときの倍率 */
  critMult: number
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
  /**
   * 設備の所持数に応じて効果が伸びる強化。
   * 所持数はラン中に変わるため、固定倍率とは別に tick 側で適用する。
   */
  tankSynergy: boolean
  feederSynergy: boolean
  breederSynergy: boolean
  launcherSynergy: boolean

  /** 最初のドラフトが早く訪れる */
  earlyDraft: boolean
  /** ドラフトの提示枚数への加算 */
  extraOffers: number
  /** 1 ラン に使えるドラフトの引き直し回数 */
  rerolls: number
  /** 変異のランク上限 */
  maxRank: number
  /** 制限時間切れを 1 回だけ猶予する秒数。0 なら無効 */
  reserveSeconds: number
  /** 建物破壊時の余剰ダメージ倍率 */
  overkillMult: number
  /** ラン終了時に在庫をすべて投入する */
  lastStand: boolean
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
    critChance: 0.05 * lv('critChance'),
    critMult: 2 + 0.7 * lv('critPower'),
    cultureMult: 1 + 0.25 * lv('cultureRate'),
    sharkRateMult: 1 + 0.25 * lv('sharkRate'),
    launchMult: 1 + 0.2 * lv('launchRate'),
    powerMult: 1 + 0.4 * lv('sharkPower'),
    families,
    maxSpeed: has('speed4') ? 4 : has('speed2') ? 2 : 1,
    autoBuyOne: has('autoBuyOne'),
    autoBuyAll: has('autoBuyAll'),
    autoClick: has('autoClick') ? 5 : 0,
    tankSynergy: has('tankSynergy'),
    feederSynergy: has('feederSynergy'),
    breederSynergy: has('breederSynergy'),
    launcherSynergy: has('launcherSynergy'),
    earlyDraft: has('earlyDraft'),
    extraOffers: has('extraOffer') ? 1 : 0,
    rerolls: has('reroll') ? 1 : 0,
    maxRank: has('prototype') ? 4 : 3,
    reserveSeconds: has('reservePower') ? 20 : 0,
    overkillMult: has('chainCollapse') ? 2 : 1,
    lastStand: has('lastStand'),
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
  if (!nodeUnlocked(m, id)) return false
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
  return nodeUnlocked(m, u.id)
}

export function buyUnlock(m: MetaState, id: string): boolean {
  const u = UNLOCK_BY_ID.get(id)
  if (!u || !unlockAvailable(m, u) || m.budget < u.cost) return false
  m.budget -= u.cost
  m.unlocked.push(u.id)
  return true
}

// ---------------------------------------------------------------------------
// スキルツリー
// ---------------------------------------------------------------------------

/**
 * 恒久強化を系統ごとの枝に並べ、前提を満たさないと先に進めないようにする。
 *
 * 平坦な一覧だと「安い順に全部買う」以外の遊び方が無く、
 * 何を伸ばしているのかがプレイヤーの中に残らない。
 * 枝に分けて前提を付けると、序盤にどの方向へ振るかが選択になる。
 */
export type BranchId = 'prod' | 'spec' | 'raid' | 'lab' | 'fam' | 'ops'

export const BRANCHES: Record<BranchId, { name: string; sub: string }> = {
  prod: { name: '培養', sub: '培養液を増やす' },
  spec: { name: '検体', sub: '検体を増やし強くする' },
  raid: { name: '侵略', sub: '投入と破壊を伸ばす' },
  lab: { name: '実験', sub: 'ドラフトを操作する' },
  fam: { name: '系統', sub: '変異の種類を解禁する' },
  ops: { name: '運用', sub: '周回を速くする' },
}

export type TreeNode = {
  id: string
  branch: BranchId
  /** 表示上の列。枝が分かれるときだけずらす */
  col: number
  row: number
  /** すべて取得済みでないと購入できない */
  requires: string[]
  /** 節に添えるサメ。何が解禁されるのかを絵で示す */
  preview?: MutationId
}

export const TREE: TreeNode[] = [
  // 培養 — 培養液の生産量。ここだけ「自動で増やす」と「手で殴る」に分かれる
  { id: 'clickPower', branch: 'prod', col: 0, row: 0, requires: [] },
  { id: 'cultureRate', branch: 'prod', col: 0, row: 1, requires: ['clickPower'] },
  { id: 'doubleClick', branch: 'prod', col: 0, row: 2, requires: ['cultureRate'] },
  { id: 'tankSynergy', branch: 'prod', col: 0, row: 3, requires: ['doubleClick'] },
  { id: 'feederSynergy', branch: 'prod', col: 0, row: 4, requires: ['tankSynergy'] },
  { id: 'critChance', branch: 'prod', col: 1, row: 1, requires: ['clickPower'] },
  { id: 'critPower', branch: 'prod', col: 1, row: 2, requires: ['critChance'] },

  // 検体 — 生産速度と戦闘力
  { id: 'startTanks', branch: 'spec', col: 2, row: 0, requires: [] },
  { id: 'sharkRate', branch: 'spec', col: 2, row: 1, requires: ['startTanks'] },
  { id: 'startSharks', branch: 'spec', col: 2, row: 2, requires: ['sharkRate'] },
  { id: 'sharkPower', branch: 'spec', col: 2, row: 3, requires: ['startSharks'] },
  { id: 'breederSynergy', branch: 'spec', col: 2, row: 4, requires: ['sharkPower'] },

  // 侵略 — 投入速度と破壊
  { id: 'launchRate', branch: 'raid', col: 3, row: 0, requires: [] },
  { id: 'lastStand', branch: 'raid', col: 3, row: 1, requires: ['launchRate'] },
  { id: 'launcherSynergy', branch: 'raid', col: 3, row: 2, requires: ['lastStand'] },
  { id: 'reservePower', branch: 'raid', col: 3, row: 3, requires: ['launcherSynergy'] },
  { id: 'chainCollapse', branch: 'raid', col: 3, row: 4, requires: ['reservePower'] },

  // 実験 — ドラフトへの干渉
  { id: 'reroll', branch: 'lab', col: 4, row: 0, requires: [] },
  { id: 'earlyDraft', branch: 'lab', col: 4, row: 1, requires: ['reroll'] },
  { id: 'extraOffer', branch: 'lab', col: 4, row: 2, requires: ['earlyDraft'] },
  { id: 'prototype', branch: 'lab', col: 4, row: 3, requires: ['extraOffer'] },

  // 系統 — 変異プールの拡張
  { id: 'family_abyss', branch: 'fam', col: 5, row: 0, requires: [], preview: 'tentacle' },
  { id: 'family_mech', branch: 'fam', col: 5, row: 1, requires: ['family_abyss'], preview: 'mecha' },
  { id: 'family_cosmic', branch: 'fam', col: 5, row: 2, requires: ['family_mech'], preview: 'alien' },
  { id: 'family_disaster', branch: 'fam', col: 5, row: 3, requires: ['family_cosmic'], preview: 'tornado' },

  // 運用 — 周回の速度
  { id: 'speed2', branch: 'ops', col: 6, row: 0, requires: [] },
  { id: 'speed4', branch: 'ops', col: 7, row: 1, requires: ['speed2'] },
  { id: 'autoClick', branch: 'ops', col: 6, row: 1, requires: ['speed2'] },
  { id: 'autoBuyOne', branch: 'ops', col: 6, row: 2, requires: ['autoClick'] },
  { id: 'autoBuyAll', branch: 'ops', col: 6, row: 3, requires: ['autoBuyOne'] },
]

export const TREE_BY_ID = new Map(TREE.map((n) => [n.id, n]))

export type NodeKind = 'numeric' | 'unlock'

export function nodeKind(id: string): NodeKind {
  return NUMERIC_BY_ID.has(id) ? 'numeric' : 'unlock'
}

/** その節を「取得済み」とみなすか。レベル制は 1 段でも上げていれば取得済み */
export function nodeTaken(m: MetaState, id: string): boolean {
  return nodeKind(id) === 'numeric' ? (m.levels[id] ?? 0) > 0 : m.unlocked.includes(id)
}

/** 前提をすべて満たしているか */
export function nodeUnlocked(m: MetaState, id: string): boolean {
  const n = TREE_BY_ID.get(id)
  if (!n) return true
  return n.requires.every((r) => nodeTaken(m, r))
}

/** その節の次の 1 段にかかる費用。上限に達していれば null */
export function nodeCost(m: MetaState, id: string): number | null {
  if (nodeKind(id) === 'unlock') {
    const u = UNLOCK_BY_ID.get(id)
    if (!u || m.unlocked.includes(id)) return null
    return u.cost
  }
  const u = NUMERIC_BY_ID.get(id)
  if (!u) return null
  const lv = m.levels[id] ?? 0
  return lv >= u.maxLevel ? null : upgradeCost(u, lv)
}

export function nodeName(id: string): string {
  return NUMERIC_BY_ID.get(id)?.name ?? UNLOCK_BY_ID.get(id)?.name ?? id
}

export function nodeDetail(m: MetaState, id: string): string {
  const n = NUMERIC_BY_ID.get(id)
  if (n) {
    const lv = m.levels[id] ?? 0
    return n.detail(Math.min(lv + 1, n.maxLevel))
  }
  return UNLOCK_BY_ID.get(id)?.detail ?? ""
}

/** 購入できるか。前提・上限・所持予算をすべて見る */
export function canPurchase(m: MetaState, id: string): boolean {
  if (!nodeUnlocked(m, id)) return false
  const cost = nodeCost(m, id)
  return cost !== null && m.budget >= cost
}

export function purchase(m: MetaState, id: string): boolean {
  if (!canPurchase(m, id)) return false
  return nodeKind(id) === 'numeric' ? buyNumeric(m, id) : buyUnlock(m, id)
}
