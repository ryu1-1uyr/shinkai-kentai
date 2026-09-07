/**
 * バランス調整用の可変パラメータをすべてここに集約する。
 * シミュレータはこのオブジェクトを差し替えて掃引する。
 */
export type Config = {
  tickHz: number
  culturePhaseSec: number

  click: {
    base: number
    perTankBonus: number
  }

  shark: {
    /** サメ 1 体の生産に必要な培養液 */
    cultureCost: number
    /** サメ 1 体の基礎戦闘力 */
    basePower: number
  }

  invasion: {
    timerModel: 'runWide' | 'perDepth'
    /** runWide: 侵略開始時の持ち時間と、深度クリアごとの継ぎ足し */
    runWideBase: number
    runWideBonusPerDepth: number
    /** perDepth: 深度ごとにリセットされる制限時間 T(d) = base + perDepth*(d-1) */
    perDepthBase: number
    perDepthStep: number
    /** 射出管を持たない状態での基礎投入速度（体/秒） */
    baseLaunchRate: number
  }

  targets: {
    /** H(d) = baseHp * hpGrowth^(d-1) */
    baseHp: number
    hpGrowth: number
    /** n(d) = countBase + countStep*(d-1) */
    countBase: number
    countStep: number
    /** ボス HP = H(d) * bossMult */
    bossMult: number
  }

  mutation: {
    /** ドラフト発生しきい値: base * growth^(k) の累積 */
    draftThresholdBase: number
    draftThresholdGrowth: number
    /** ランク r の発現率 = baseRate * r（線形） */
    rankRateLinear: boolean
    /** ランク r の倍率 = basePower * rankPowerMult^(r-1)（指数） */
    rankPowerMult: number
    /** 1 つの変異が取りうる最大ランク */
    maxRank: number
    /** 1 回のドラフトで提示する枚数 */
    draftSize: number
  }
}

export const DEFAULT_CONFIG: Config = {
  tickHz: 20,
  culturePhaseSec: 60,

  click: {
    base: 2,
    perTankBonus: 0.15,
  },

  shark: {
    cultureCost: 4,
    basePower: 1,
  },

  invasion: {
    timerModel: 'runWide',
    runWideBase: 120,
    runWideBonusPerDepth: 15,
    perDepthBase: 90,
    perDepthStep: 10,
    baseLaunchRate: 8,
  },

  targets: {
    baseHp: 3000,
    hpGrowth: 5.0,
    countBase: 8,
    countStep: 2,
    bossMult: 10,
  },

  mutation: {
    draftThresholdBase: 50,
    draftThresholdGrowth: 2.2,
    rankRateLinear: true,
    rankPowerMult: 3.0,
    maxRank: 3,
    draftSize: 3,
  },
}

/** 部分的な差分を当てて新しい Config を作る（掃引用） */
export function withConfig(base: Config, patch: DeepPartial<Config>): Config {
  const out = structuredClone(base) as Config
  for (const [k, v] of Object.entries(patch)) {
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      Object.assign((out as Record<string, unknown>)[k] as object, v)
    } else if (v !== undefined) {
      ;(out as Record<string, unknown>)[k] = v
    }
  }
  return out
}

type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? Partial<T[K]> : T[K] }
