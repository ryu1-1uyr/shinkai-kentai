import type { Config } from './config.ts'
import { t } from '../text/index.ts'

/** 深度 d の通常建築物 1 棟の HP */
export function targetHp(depth: number, cfg: Config): number {
  return cfg.targets.baseHp * Math.pow(cfg.targets.hpGrowth, depth - 1)
}

/** 深度 d でボスが出るまでに壊す通常建築物の数 */
export function targetCount(depth: number, cfg: Config): number {
  return cfg.targets.countBase + cfg.targets.countStep * (depth - 1)
}

/**
 * 深度 d のボス HP。
 *
 * ボスは通常建築物の 10 倍あり、深度 1 では**その深度の総 HP の 56%** をボスが占める。
 * 初回ランが届かない原因がここに集中していたので、浅いところだけボスを軽くする。
 * bossRampDepth 以降は本来の重さに戻るため、後半の難易度は変わらない。
 */
export function bossHp(depth: number, cfg: Config): number {
  const ramp = Math.min(1, (depth + 1) / (cfg.targets.bossRampDepth + 1))
  return targetHp(depth, cfg) * cfg.targets.bossMult * ramp
}

/** 深度 d を丸ごと突破するのに必要な総ダメージ */
export function totalHpOfDepth(depth: number, cfg: Config): number {
  return targetHp(depth, cfg) * targetCount(depth, cfg) + bossHp(depth, cfg)
}

/** perDepth モデルにおける深度 d の制限時間 */
export function perDepthTime(depth: number, cfg: Config): number {
  return cfg.invasion.perDepthBase + cfg.invasion.perDepthStep * (depth - 1)
}

/**
 * 深度ごとの呼称。
 * 通常建築物とボスで語彙のプールを分け、そこから無作為に選ぶ。
 * 同じ深度でもランごとに名前が変わり、周回の表情が増える。
 * 語彙そのものは text/ja.ts が持つ。
 */
export type DepthNames = { zone: string; normal: readonly string[]; boss: readonly string[] }

/**
 * 最も深いところの語彙は「記録なし」の扱いなので、
 * 表の末尾を超えた深度はそこへ寄せる。
 */
export function depthNames(depth: number): DepthNames {
  return t.depth[Math.min(Math.max(1, depth), t.depth.length) - 1]
}

/** 深度の呼称だけが欲しいとき */
export function depthName(depth: number): { zone: string } {
  return { zone: depthNames(depth).zone }
}
