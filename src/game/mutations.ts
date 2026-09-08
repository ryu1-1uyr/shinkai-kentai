import type { Config } from './config.ts'

// prettier-ignore
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

// prettier-ignore
export const RARITY: Record<Rarity, { weight: number; scale: number }> = {
  common: { weight: 1.0, scale: 1 },
  uncommon: { weight: 0.7, scale: 120 },
  rare: { weight: 0.45, scale: 600 },
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
// 表として読むために整形を止めている（1 行 = 1 変異）
// prettier-ignore
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
  const raw = cfg.mutation.rankRateLinear ? def.baseRate * rank : 1 - Math.pow(1 - def.baseRate, rank)
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
export function powerOfMask(mask: MutationMask, ranks: MutationRanks, cfg: Config, powerMult = 1): number {
  let p = cfg.shark.basePower * powerMult
  for (const def of MUTATIONS) {
    if (hasMutation(mask, def)) p *= powerAt(def, ranks.get(def.id) ?? 0, cfg)
  }
  return p
}

/**
 * mask ごとの戦闘力を覚えておく入れ物。
 *
 * powerOfMask は変異 32 種を毎回舐めるので、在庫が数千種になると
 * 1 ティックあたり数ミリ秒に達する。値は mask とランクだけで決まり、
 * ランクが動くのはドラフトのときだけなので、そこで捨てれば使い回せる。
 */
export type PowerCache = Map<MutationMask, number>

export function cachedPower(
  mask: MutationMask,
  ranks: MutationRanks,
  cfg: Config,
  cache: PowerCache,
): number {
  const hit = cache.get(mask)
  if (hit !== undefined) return hit
  const v = powerOfMask(mask, ranks, cfg)
  cache.set(mask, v)
  return v
}

/**
 * 分布に残す組み合わせの数。
 *
 * 変異は独立にロールされるので、組み合わせは 2^(取得数) 通りある。
 * 16 種で 65536 通りになり、毎ティック全部に頭数を配ると 21 ms かかって
 * ゲームが破綻する。上限を置いて打ち切る。
 *
 * 残す基準を 2 つに分けているのは、片方だけでは足りないため。
 *  出やすい順  … 在庫や記録に並ぶ見た目を保つ。落とすと通常サメだらけになる
 *  期待ダメージ順 … 戦闘力を保つ。ダメージのほとんどは「滅多に出ないが桁違いに強い個体」が
 *                 担っているので、出やすい順だけで切ると戦力が消し飛ぶ
 */
export const DIST_KEEP_COMMON = 1024
export const DIST_KEEP_STRONG = 1024

/**
 * いま生まれるサメの mask 別出現確率。各変異が独立にロールされる。
 * 戻り値は [mask, probability] の配列で、確率の合計は 1。
 *
 * 打ち切りは展開の途中で行う。全部展開してから間引くと、
 * 変異 20 種で 100 万件を一度作ることになって間引く前に落ちる。
 *
 * 途中の要素はそれぞれ「まだ展開していない変異ぶんの部分木」を持つが、
 * その部分木が最終的に持つ確率もダメージも、残りの変異による同じ係数が
 * 掛かるだけなので、途中の p と p*戦闘力 で順位を付ければ
 * 最終的な寄与の順位と一致する。
 */
export function birthDistribution(ranks: MutationRanks, cfg: Config): Array<[MutationMask, number]> {
  const cap = DIST_KEEP_COMMON + DIST_KEEP_STRONG
  // [mask, 確率, 戦闘力]。戦闘力は間引きの順位付けにだけ使う
  let dist: Array<[MutationMask, number, number]> = [[0, 1, cfg.shark.basePower]]
  for (const def of MUTATIONS) {
    const rank = ranks.get(def.id) ?? 0
    if (rank <= 0) continue
    const p = rateAt(def, rank, cfg)
    const mult = powerAt(def, rank, cfg)
    const next: Array<[MutationMask, number, number]> = []
    for (const [mask, prob, pw] of dist) {
      if (prob * (1 - p) > 0) next.push([mask, prob * (1 - p), pw])
      if (prob * p > 0) next.push([addMutation(mask, def), prob * p, pw * mult])
    }
    dist = next.length > cap ? prune(next) : next
  }
  return normalize(dist)
}

/** 出やすい順の上位と、期待ダメージの大きい順の上位を残す */
function prune(rows: Array<[MutationMask, number, number]>): Array<[MutationMask, number, number]> {
  const byProb = [...rows].sort((a, b) => b[1] - a[1]).slice(0, DIST_KEEP_COMMON)
  const byDamage = [...rows].sort((a, b) => b[1] * b[2] - a[1] * a[2]).slice(0, DIST_KEEP_STRONG)
  const keep = new Map<MutationMask, [MutationMask, number, number]>()
  for (const r of byProb) keep.set(r[0], r)
  for (const r of byDamage) keep.set(r[0], r)
  return [...keep.values()]
}

/**
 * 間引きで落ちたぶんの確率を戻して合計を 1 にする。
 *
 * 全体を一律に割り増すと、滅多に出ない最強個体の確率まで持ち上がって
 * 期待戦闘力が何桁も膨らむ。割り増すのは出やすい側だけにする。
 */
function normalize(rows: Array<[MutationMask, number, number]>): Array<[MutationMask, number]> {
  let mass = 0
  for (const r of rows) mass += r[1]
  if (mass >= 1 - 1e-12) return rows.map((r) => [r[0], r[1]])

  const order = [...rows].sort((a, b) => b[1] - a[1])
  const common = new Set(order.slice(0, DIST_KEEP_COMMON).map((r) => r[0]))
  let commonMass = 0
  let strongMass = 0
  for (const r of rows) {
    if (common.has(r[0])) commonMass += r[1]
    else strongMass += r[1]
  }
  if (commonMass <= 0) return rows.map((r) => [r[0], r[1]])
  const scale = (1 - strongMass) / commonMass
  return rows.map((r) => [r[0], common.has(r[0]) ? r[1] * scale : r[1]])
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
