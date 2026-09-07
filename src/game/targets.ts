import type { Config } from './config.ts'

/** 深度 d の通常建築物 1 棟の HP */
export function targetHp(depth: number, cfg: Config): number {
  return cfg.targets.baseHp * Math.pow(cfg.targets.hpGrowth, depth - 1)
}

/** 深度 d でボスが出るまでに壊す通常建築物の数 */
export function targetCount(depth: number, cfg: Config): number {
  return cfg.targets.countBase + cfg.targets.countStep * (depth - 1)
}

/** 深度 d のボス HP */
export function bossHp(depth: number, cfg: Config): number {
  return targetHp(depth, cfg) * cfg.targets.bossMult
}

/** 深度 d を丸ごと突破するのに必要な総ダメージ */
export function totalHpOfDepth(depth: number, cfg: Config): number {
  return targetHp(depth, cfg) * targetCount(depth, cfg) + bossHp(depth, cfg)
}

/** perDepth モデルにおける深度 d の制限時間 */
export function perDepthTime(depth: number, cfg: Config): number {
  return cfg.invasion.perDepthBase + cfg.invasion.perDepthStep * (depth - 1)
}

export type DepthName = { zone: string; normal: string; boss: string }

/**
 * 深度の呼称。深度 11 以降は「潜っていたはずが上昇している」ことになるが、
 * 報告書上は深度計の異常として処理される。
 */
const DEPTH_NAMES: DepthName[] = [
  { zone: '沿岸の町', normal: '民家', boss: '灯台' },
  { zone: '地方都市', normal: 'アパート', boss: 'ショッピングモール' },
  { zone: '県庁所在地', normal: 'オフィスビル', boss: '国際空港' },
  { zone: '大都市', normal: '高層ビル', boss: '海上都市' },
  { zone: '首都', normal: '官庁街', boss: '国会議事堂' },
  { zone: '軍事拠点', normal: '格納庫', boss: '原子力空母' },
  { zone: '大陸沿岸', normal: '都市圏', boss: '大陸間橋梁' },
  { zone: '内陸部', normal: '工業地帯', boss: '超大型ダム' },
  { zone: '海溝', normal: '深海基地', boss: '古代遺跡' },
  { zone: '海溝底', normal: '熱水噴出孔', boss: '未確認構造物' },
  { zone: '成層圏 ※深度計異常', normal: '積乱雲', boss: 'サメ竜巻' },
  { zone: '中間圏 ※深度計異常', normal: '気象観測機', boss: '気象衛星' },
  { zone: '軌道上 ※査読非通過', normal: '通信衛星', boss: '軌道エレベータ' },
]

export function depthName(depth: number): DepthName {
  const i = Math.min(depth, DEPTH_NAMES.length) - 1
  if (i < 0) return DEPTH_NAMES[0]
  if (depth > DEPTH_NAMES.length) {
    return { zone: `深宇宙 ※記録なし`, normal: '未知の構造体', boss: `未知の巨大構造体` }
  }
  return DEPTH_NAMES[i]
}
