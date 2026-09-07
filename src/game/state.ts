import type { Config } from './config.ts'
import { BUILDINGS, BUILDING_INDEX } from './buildings.ts'
import { type MetaEffects, metaEffects, createMeta } from './meta.ts'
import type { Inventory } from './inventory.ts'
import { type MutationDef, type MutationId, type MutationMask, type MutationRanks, birthDistribution } from './mutations.ts'

export type Phase = 'culture' | 'invasion' | 'over'

export type LogKind = 'hit' | 'boss' | 'depth' | 'draft' | 'system' | 'birth'
export type LogEntry = { t: number; kind: LogKind; text: string }

/** ログの保持件数。表示に使うぶんだけあればよい */
const LOG_LIMIT = 40

export function pushLog(s: GameState, kind: LogKind, text: string): void {
  s.log.unshift({ t: s.t, kind, text })
  if (s.log.length > LOG_LIMIT) s.log.length = LOG_LIMIT
}
export type EndReason = 'timeout' | 'running'

export type GameState = {
  /** 経過ゲーム内秒 */
  t: number
  phase: Phase
  endReason: EndReason

  culture: number
  /** BUILDINGS と同じ順の所持数 */
  buildings: number[]

  inv: Inventory
  /** 累計出生数。在庫と違い減らない（実験記録として表示する） */
  births: Map<MutationMask, number>
  ranks: MutationRanks
  /** ranks が変わるたびに作り直す出生分布のキャッシュ */
  birthDist: Array<[MutationMask, number]>

  /** サメの累計生産数。ドラフトのトリガー */
  producedTotal: number
  nextDraftAt: number
  draftCount: number
  /** ドラフト提示中。null 以外の間はゲームが進行しない（プレイヤーの選択待ち） */
  pendingOffers: MutationDef[] | null

  /** 現在挑戦中の深度 */
  depth: number
  /** 現深度で破壊した通常建築物の数 */
  destroyed: number
  onBoss: boolean
  currentHp: number

  timeLeft: number
  /** 突破し終えた深度の数 */
  clearedDepth: number
  score: number

  rngState: number

  /** 交戦ログ。新しいものが先頭。表示用なので上限を設けて捨てる */
  log: LogEntry[]

  /** 恒久強化の効果。ラン中は変化しない */
  meta: MetaEffects
  /** 残りの引き直し回数 */
  rerollsLeft: number
  /** 予備電源を使ったか */
  reserveUsed: boolean
}

export function createState(cfg: Config, seed: number, meta?: MetaEffects): GameState {
  const eff = meta ?? metaEffects(createMeta())
  const s: GameState = {
    t: 0,
    phase: 'culture',
    endReason: 'running',
    culture: 0,
    buildings: BUILDINGS.map(() => 0),
    inv: new Map(),
    births: new Map(),
    ranks: new Map<MutationId, number>(),
    birthDist: [[0, 1]],
    producedTotal: 0,
    nextDraftAt: eff.earlyDraft ? 10 : cfg.mutation.draftThresholdBase,
    draftCount: 0,
    pendingOffers: null,
    depth: 1,
    destroyed: 0,
    onBoss: false,
    currentHp: 0,
    timeLeft: 0,
    clearedDepth: 0,
    score: 0,
    rngState: seed >>> 0,
    log: [],
    meta: eff,
    rerollsLeft: eff.rerolls,
    reserveUsed: false,
  }

  // 恒久強化ぶんの初期値を積む
  const tankIndex = BUILDING_INDEX.get('tank')
  if (tankIndex !== undefined) s.buildings[tankIndex] = eff.startTanks
  if (eff.startSharks > 0) {
    s.inv.set(0, eff.startSharks)
    s.births.set(0, eff.startSharks)
    s.producedTotal = eff.startSharks
  }
  return s
}

export function refreshBirthDist(s: GameState, cfg: Config): void {
  s.birthDist = birthDistribution(s.ranks, cfg)
}

/** mulberry32。再現性のある擬似乱数 */
export function rng(s: GameState): number {
  s.rngState = (s.rngState + 0x6d2b79f5) >>> 0
  let t = s.rngState
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}
