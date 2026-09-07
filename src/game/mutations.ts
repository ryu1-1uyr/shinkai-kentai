import type { Config } from './config.ts'

export type MutationId =
  | 'glow' | 'frenzy' | 'twinHead' | 'swarm' | 'giant' | 'ancient'
  | 'pressure' | 'abyss' | 'tentacle' | 'eldritch'
  | 'armor' | 'mecha' | 'volt' | 'autonomous'
  | 'zeroG' | 'meteor' | 'cosmic' | 'alien'

/** レア度。出現の重みと、出始める生産数スケールを決める */
export type Rarity = 'common' | 'uncommon' | 'rare' | 'legendary'

/**
 * 系統。恒久強化はこの単位で解禁する。
 * 1 変異 1 解禁にすると、変異を 30 種まで増やしたときに
 * 解禁ボタンが 30 個並ぶことになるため。
 */
export type Family = 'bio' | 'abyss' | 'mech' | 'cosmic'

export const FAMILIES: Record<Family, { name: string; initial: boolean }> = {
  bio: { name: '生体系', initial: true },
  abyss: { name: '深海系', initial: false },
  mech: { name: '機械系', initial: false },
  cosmic: { name: '宇宙系', initial: false },
}

export const RARITY: Record<Rarity, { weight: number; scale: number }> = {
  common:    { weight: 1.0,  scale: 1 },
  uncommon:  { weight: 0.7,  scale: 120 },
  rare:      { weight: 0.45, scale: 600 },
  legendary: { weight: 0.16, scale: 2000 },
}

/** 重みの立ち上がりの鋭さ。0.85 は「生産 100 倍で出現率 50 倍」に相当する */
export const RARITY_RAMP = 0.85

/**
 * 在庫のキーはビットマスク（`1 << bit`）で持つ。
 * JS のビット演算は 32bit 符号付きのため、**変異は最大 31 種まで**。
 * それ以上に増やす場合はキーの表現を変える必要があるが、
 * ビット操作はこのファイルに閉じているので差し替えは局所的に済む。
 */
export const MAX_MUTATIONS = 31

export type MutationDef = {
  id: MutationId
  name: string
  /** 複合サメの名前を組むときの接頭辞 */
  prefix: string
  /** ビットマスク上の位置 */
  bit: number
  /** ランク 1 の発現率 */
  baseRate: number
  /** ランク 1 の戦闘力倍率 */
  basePower: number
  rarity: Rarity
  family: Family
}

/**
 * 定義順がそのまま複合サメの名前の並び順になる。
 * 生体 → 深海 → 機械 → 宇宙 の順に接頭辞が付く。
 */
export const MUTATIONS: MutationDef[] = [
  // --- 生体系（初期から出る） ---
  { id: 'glow',       name: '発光',       prefix: 'ヒカリ',     bit: 0,  baseRate: 0.18, basePower: 5,   rarity: 'common',    family: 'bio' },
  { id: 'frenzy',     name: '凶暴化',     prefix: '狂乱',       bit: 1,  baseRate: 0.15, basePower: 4,   rarity: 'common',    family: 'bio' },
  { id: 'twinHead',   name: '双頭化',     prefix: '双頭',       bit: 2,  baseRate: 0.10, basePower: 8,   rarity: 'common',    family: 'bio' },
  { id: 'swarm',      name: '群体化',     prefix: '群体',       bit: 3,  baseRate: 0.12, basePower: 6,   rarity: 'common',    family: 'bio' },
  { id: 'giant',      name: '巨大化',     prefix: 'メガ',       bit: 4,  baseRate: 0.08, basePower: 25,  rarity: 'uncommon',  family: 'bio' },
  { id: 'ancient',    name: '古代種',     prefix: '古代',       bit: 5,  baseRate: 0.06, basePower: 40,  rarity: 'uncommon',  family: 'bio' },

  // --- 深海系 ---
  { id: 'pressure',   name: '高圧適応',   prefix: '深圧',       bit: 6,  baseRate: 0.09, basePower: 30,  rarity: 'uncommon',  family: 'abyss' },
  { id: 'abyss',      name: '深淵種',     prefix: 'アビス',     bit: 7,  baseRate: 0.05, basePower: 90,  rarity: 'rare',      family: 'abyss' },
  { id: 'tentacle',   name: '触手化',     prefix: 'タコ',       bit: 8,  baseRate: 0.05, basePower: 130, rarity: 'rare',      family: 'abyss' },
  { id: 'eldritch',   name: '古代神性',   prefix: '邪神',       bit: 9,  baseRate: 0.03, basePower: 450, rarity: 'legendary', family: 'abyss' },

  // --- 機械系 ---
  { id: 'armor',      name: '装甲化',     prefix: 'アーマー',   bit: 10, baseRate: 0.10, basePower: 18,  rarity: 'uncommon',  family: 'mech' },
  { id: 'mecha',      name: '機械化',     prefix: 'メカ',       bit: 11, baseRate: 0.05, basePower: 60,  rarity: 'rare',      family: 'mech' },
  { id: 'volt',       name: '帯電化',     prefix: 'サンダー',   bit: 12, baseRate: 0.05, basePower: 120, rarity: 'rare',      family: 'mech' },
  { id: 'autonomous', name: '自律兵装',   prefix: 'オート',     bit: 13, baseRate: 0.03, basePower: 400, rarity: 'legendary', family: 'mech' },

  // --- 宇宙系 ---
  { id: 'zeroG',      name: '無重力',     prefix: 'ゼロG',      bit: 14, baseRate: 0.10, basePower: 20,  rarity: 'uncommon',  family: 'cosmic' },
  { id: 'meteor',     name: '隕石化',     prefix: 'メテオ',     bit: 15, baseRate: 0.05, basePower: 100, rarity: 'rare',      family: 'cosmic' },
  { id: 'cosmic',     name: '宇宙化',     prefix: 'コズミック', bit: 16, baseRate: 0.03, basePower: 350, rarity: 'legendary', family: 'cosmic' },
  { id: 'alien',      name: 'エイリアン', prefix: 'エイリアン', bit: 17, baseRate: 0.03, basePower: 500, rarity: 'legendary', family: 'cosmic' },
]

if (MUTATIONS.length > MAX_MUTATIONS) {
  throw new Error(`変異は ${MAX_MUTATIONS} 種までしか扱えない（在庫キーがビットマスクのため）`)
}

/**
 * 生産数 P におけるドラフト出現の重み。
 * 生産が伸びるほどレアな変異が提示されるようになる。
 */
export function offerWeight(def: MutationDef, produced: number): number {
  const { weight, scale } = RARITY[def.rarity]
  const ramp = Math.min(1, Math.pow(Math.max(produced, 0) / scale, RARITY_RAMP))
  return weight * ramp
}

export const MUTATION_BY_ID = new Map(MUTATIONS.map((m) => [m.id, m]))

/** ランク r における発現率 */
export function rateAt(def: MutationDef, rank: number, cfg: Config): number {
  if (rank <= 0) return 0
  const raw = cfg.mutation.rankRateLinear
    ? def.baseRate * rank
    : 1 - Math.pow(1 - def.baseRate, rank)
  // 発現率は 90% で頭打ちにする（全個体が同一変異になると在庫の多様性が死ぬ）
  return Math.min(raw, 0.9)
}

/** ランク r における戦闘力倍率 */
export function powerAt(def: MutationDef, rank: number, cfg: Config): number {
  if (rank <= 0) return 1
  return def.basePower * Math.pow(cfg.mutation.rankPowerMult, rank - 1)
}

export type MutationMask = number

/** 保有変異の集合。key は MutationId、value はランク */
export type MutationRanks = Map<MutationId, number>

/**
 * サメ 1 体の戦闘力。持っている変異の倍率をすべて掛け合わせる。
 * mask から一意に決まるので、在庫スタックに戦闘力を保存しなくてもよい。
 */
export function powerOfMask(
  mask: MutationMask,
  ranks: MutationRanks,
  cfg: Config,
  powerMult = 1,
): number {
  let p = cfg.shark.basePower * powerMult
  for (const def of MUTATIONS) {
    if (mask & (1 << def.bit)) p *= powerAt(def, ranks.get(def.id) ?? 0, cfg)
  }
  return p
}

/**
 * いま生まれるサメの mask 別出現確率。各変異が独立にロールされる。
 * 戻り値は [mask, probability] の配列で、確率の合計は 1。
 */
export function birthDistribution(ranks: MutationRanks, cfg: Config): Array<[MutationMask, number]> {
  let dist: Array<[MutationMask, number]> = [[0, 1]]
  for (const def of MUTATIONS) {
    const rank = ranks.get(def.id) ?? 0
    if (rank <= 0) continue
    const p = rateAt(def, rank, cfg)
    const next: Array<[MutationMask, number]> = []
    for (const [mask, prob] of dist) {
      if (prob * (1 - p) > 0) next.push([mask, prob * (1 - p)])
      if (prob * p > 0) next.push([mask | (1 << def.bit), prob * p])
    }
    dist = next
  }
  return dist
}

/** サメ 1 体あたりの期待戦闘力  E = Π (1 + p*(m-1)) */
export function expectedPower(ranks: MutationRanks, cfg: Config, powerMult = 1): number {
  let e = cfg.shark.basePower * powerMult
  for (const def of MUTATIONS) {
    const rank = ranks.get(def.id) ?? 0
    if (rank <= 0) continue
    e *= 1 + rateAt(def, rank, cfg) * (powerAt(def, rank, cfg) - 1)
  }
  return e
}

/** 複合サメの名前。変異 ID の定義順に接頭辞を連結するだけ */
export function nameOfMask(mask: MutationMask): string {
  const parts = MUTATIONS.filter((m) => mask & (1 << m.bit)).map((m) => m.prefix)
  return parts.length === 0 ? '通常サメ' : parts.join('') + 'サメ'
}
