import type { Config } from './config.ts'

export type MutationId =
  | 'glow' | 'frenzy' | 'swift' | 'albino' | 'spike' | 'poison'
  | 'twinHead' | 'tripleHead' | 'swarm' | 'triple' | 'giant'
  | 'fungus' | 'ghost' | 'zombie' | 'ancient'
  | 'pressure' | 'abyss' | 'tentacle' | 'eldritch'
  | 'armor' | 'mecha' | 'volt' | 'autonomous'
  | 'zeroG' | 'meteor' | 'cosmic' | 'alien'
  | 'tornado' | 'magma' | 'frozen' | 'storm' | 'tsunami'

/** レア度。出現の重みと、出始める生産数スケールを決める */
export type Rarity = 'common' | 'uncommon' | 'rare' | 'legendary'

/**
 * 系統。恒久強化はこの単位で解禁する。
 * 1 変異 1 解禁にすると、変異を 30 種まで増やしたときに
 * 解禁ボタンが 30 個並ぶことになるため。
 */
export type Family = 'bio' | 'abyss' | 'mech' | 'cosmic' | 'disaster'

export const FAMILIES: Record<Family, { name: string; initial: boolean }> = {
  bio: { name: '生体系', initial: true },
  abyss: { name: '深海系', initial: false },
  mech: { name: '機械系', initial: false },
  cosmic: { name: '宇宙系', initial: false },
  disaster: { name: '災害系', initial: false },
}

export const RARITY: Record<Rarity, { weight: number; scale: number }> = {
  common:    { weight: 1.0,  scale: 1 },
  uncommon:  { weight: 0.7,  scale: 120 },
  rare:      { weight: 0.45, scale: 600 },
  legendary: { weight: 0.16, scale: 2000 },
}

/** 重みの立ち上がりの鋭さ。0.85 は「生産 100 倍で出現率 50 倍」に相当する */
export const RARITY_RAMP = 0.85

export type MutationMask = number

/**
 * 在庫のキーは「変異ごとのビットを立てた整数」で持つ。
 *
 * ビット演算子（`1 << bit`）は 32bit 符号付きに丸められるため 31 種で頭打ちになる。
 * そこで `2 ** bit` の算術で扱う。JS の数値は 2^53 まで整数を正確に表せるので、
 * **変異は最大 53 種**まで増やせる。Map のキーも数値のままなので速度は変わらない。
 *
 * ビット操作は maskOf / hasMutation / addMutation に閉じてあるので、
 * さらに増やしたくなった場合もここだけ差し替えればよい。
 */
export const MAX_MUTATIONS = 53

/** その変異 1 つぶんのマスク */
export function maskOf(def: { bit: number }): MutationMask {
  return Math.pow(2, def.bit)
}

/** マスクにその変異が含まれるか */
export function hasMutation(mask: MutationMask, def: { bit: number }): boolean {
  return Math.floor(mask / Math.pow(2, def.bit)) % 2 === 1
}

/** マスクに変異を足す（既に含まれていれば何もしない） */
export function addMutation(mask: MutationMask, def: { bit: number }): MutationMask {
  return hasMutation(mask, def) ? mask : mask + maskOf(def)
}

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
  { id: 'glow',       name: '発光',       prefix: '発光',             bit: 0,  baseRate: 0.18, basePower: 5,   rarity: 'common',    family: 'bio' },
  { id: 'frenzy',     name: '凶暴化',     prefix: '狂乱',             bit: 1,  baseRate: 0.15, basePower: 4,   rarity: 'common',    family: 'bio' },
  { id: 'swift',      name: '高速遊泳',   prefix: 'スイフト',         bit: 2,  baseRate: 0.16, basePower: 6,   rarity: 'common',    family: 'bio' },
  { id: 'albino',     name: '白化',       prefix: 'アルビノ',         bit: 3,  baseRate: 0.12, basePower: 10,  rarity: 'common',    family: 'bio' },
  { id: 'spike',      name: '棘皮',       prefix: 'スパイク',         bit: 4,  baseRate: 0.13, basePower: 9,   rarity: 'common',    family: 'bio' },
  { id: 'poison',     name: '猛毒',       prefix: 'ポイズン',         bit: 5,  baseRate: 0.08, basePower: 30,  rarity: 'uncommon',  family: 'bio' },
  { id: 'twinHead',   name: '双頭化',     prefix: 'デュアルヘッド',   bit: 6,  baseRate: 0.10, basePower: 8,   rarity: 'common',    family: 'bio' },
  { id: 'tripleHead', name: '三頭化',     prefix: 'トリプルヘッド',   bit: 7,  baseRate: 0.05, basePower: 85,  rarity: 'rare',      family: 'bio' },
  { id: 'swarm',      name: 'ダブル',     prefix: 'ダブル',           bit: 8,  baseRate: 0.12, basePower: 6,   rarity: 'common',    family: 'bio' },
  { id: 'triple',     name: 'トリプル',   prefix: 'トリプル',         bit: 9,  baseRate: 0.07, basePower: 20,  rarity: 'uncommon',  family: 'bio' },
  { id: 'giant',      name: '巨大化',     prefix: '巨大',             bit: 10, baseRate: 0.08, basePower: 25,  rarity: 'uncommon',  family: 'bio' },
  { id: 'fungus',     name: '菌類化',     prefix: 'キノコ',           bit: 11, baseRate: 0.08, basePower: 28,  rarity: 'uncommon',  family: 'bio' },
  { id: 'ghost',      name: '幽体化',     prefix: 'ゴースト',         bit: 12, baseRate: 0.05, basePower: 95,  rarity: 'rare',      family: 'bio' },
  { id: 'zombie',     name: '屍化',       prefix: 'ゾンビ',           bit: 13, baseRate: 0.05, basePower: 110, rarity: 'rare',      family: 'bio' },
  { id: 'ancient',    name: '超古代',     prefix: 'エンシェント',     bit: 14, baseRate: 0.03, basePower: 420, rarity: 'legendary', family: 'bio' },

  // --- 深海系 ---
  { id: 'pressure',   name: '高圧適応',   prefix: '深圧',             bit: 15, baseRate: 0.09, basePower: 30,  rarity: 'uncommon',  family: 'abyss' },
  { id: 'abyss',      name: '深淵種',     prefix: 'アビス',           bit: 16, baseRate: 0.05, basePower: 90,  rarity: 'rare',      family: 'abyss' },
  { id: 'tentacle',   name: '触手化',     prefix: 'タコ',             bit: 17, baseRate: 0.05, basePower: 130, rarity: 'rare',      family: 'abyss' },
  { id: 'eldritch',   name: '古代神性',   prefix: '邪神',             bit: 18, baseRate: 0.03, basePower: 450, rarity: 'legendary', family: 'abyss' },

  // --- 機械系 ---
  { id: 'armor',      name: '装甲化',     prefix: 'アーマード',       bit: 19, baseRate: 0.10, basePower: 18,  rarity: 'uncommon',  family: 'mech' },
  { id: 'mecha',      name: '機械化',     prefix: 'メカ',             bit: 20, baseRate: 0.05, basePower: 60,  rarity: 'rare',      family: 'mech' },
  { id: 'volt',       name: '帯電化',     prefix: 'サンダー',         bit: 21, baseRate: 0.05, basePower: 120, rarity: 'rare',      family: 'mech' },
  { id: 'autonomous', name: '機械兵装',   prefix: '機械兵装',         bit: 22, baseRate: 0.03, basePower: 400, rarity: 'legendary', family: 'mech' },

  // --- 宇宙系 ---
  { id: 'zeroG',      name: '飛行',       prefix: 'フライング',       bit: 23, baseRate: 0.10, basePower: 20,  rarity: 'uncommon',  family: 'cosmic' },
  { id: 'meteor',     name: '隕石',       prefix: 'メテオ',           bit: 24, baseRate: 0.05, basePower: 100, rarity: 'rare',      family: 'cosmic' },
  { id: 'cosmic',     name: '宇宙適応',   prefix: 'コズミック',       bit: 25, baseRate: 0.03, basePower: 350, rarity: 'legendary', family: 'cosmic' },
  { id: 'alien',      name: 'エイリアン', prefix: 'エイリアン',       bit: 26, baseRate: 0.03, basePower: 500, rarity: 'legendary', family: 'cosmic' },

  // --- 災害系 ---
  { id: 'tornado',    name: '竜巻化',     prefix: 'トルネード',       bit: 27, baseRate: 0.09, basePower: 22,  rarity: 'uncommon',  family: 'disaster' },
  { id: 'magma',      name: '灼熱',       prefix: 'マグマ',           bit: 28, baseRate: 0.08, basePower: 32,  rarity: 'uncommon',  family: 'disaster' },
  { id: 'frozen',     name: '氷結',       prefix: 'フローズン',       bit: 29, baseRate: 0.05, basePower: 105, rarity: 'rare',      family: 'disaster' },
  { id: 'storm',      name: '暴風',       prefix: 'ストーム',         bit: 30, baseRate: 0.05, basePower: 120, rarity: 'rare',      family: 'disaster' },
  { id: 'tsunami',    name: '大津波',     prefix: 'ツナミ',           bit: 31, baseRate: 0.03, basePower: 430, rarity: 'legendary', family: 'disaster' },
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
    if (hasMutation(mask, def)) p *= powerAt(def, ranks.get(def.id) ?? 0, cfg)
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
      if (prob * p > 0) next.push([addMutation(mask, def), prob * p])
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
  const parts = MUTATIONS.filter((m) => hasMutation(mask, m)).map((m) => m.prefix)
  return parts.length === 0 ? '通常サメ' : parts.join('') + 'サメ'
}
