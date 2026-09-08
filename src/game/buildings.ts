import { t } from '../text/index.ts'
export type BuildingId = 'tank' | 'feeder' | 'breeder' | 'accelerator' | 'launcher'

export type BuildingDef = {
  id: BuildingId
  baseCost: number
  growth: number
  /** 培養液の毎秒産出 */
  cultureRate?: number
  /** サメの毎秒産出 */
  sharkRate?: number
  /** サメ産出への乗算倍率（1 個につき） */
  sharkRateMult?: number
  /** 侵略時の毎秒投入数 */
  launchRate?: number
  /** クリック倍率へのボーナス（1 個につき） */
  clickBonus?: boolean
}

// 表として読むために整形を止めている（1 行 = 1 設備）
// prettier-ignore
export const BUILDINGS: BuildingDef[] = [
  { id: 'tank',          baseCost: 10,     growth: 1.13,   cultureRate: 1, clickBonus: true },
  { id: 'feeder',        baseCost: 120,    growth: 1.14,   cultureRate: 10 },
  { id: 'breeder',       baseCost: 25,     growth: 1.15,   sharkRate: 0.8 },
  { id: 'accelerator',   baseCost: 800,    growth: 1.2,    sharkRateMult: 0.2 },
  { id: 'launcher',      baseCost: 600,    growth: 1.18,   launchRate: 15 },
]

/** 表示名は text/ja.ts が持つ */
export function buildingName(id: BuildingId): string {
  return t.building[id].name
}

export const BUILDING_INDEX = new Map(BUILDINGS.map((b, i) => [b.id, i]))

/** n 個所持している状態で次の 1 個を買う価格 */
export function costOf(def: BuildingDef, owned: number): number {
  return def.baseCost * Math.pow(def.growth, owned)
}
