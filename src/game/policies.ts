/**
 * 研究方針。
 *
 * 突然変異が「検体をどう改造するか」なのに対し、こちらは
 * 「この実験をどう進めるか」という**施設側**の選択。
 * 累計で獲得した培養液がしきい値を超えるたびに 3 枚提示される。
 *
 * 狙いは 3 つ。
 *  1. 培養液はクリック 1 回目から溜まるので、**開始 10 秒で最初の選択が発生する**。
 *     専用のチュートリアルを作らずに「カードを選ぶゲーム」だと体で覚えさせる
 *  2. ラン内の変数が変異と方針の 2 軸になり、組み合わせが掛け算で増える
 *  3. 培養液を稼ぐこと自体に目的が生まれる（いまは検体を作るための中間素材でしかない）
 */

export type PolicyId =
  | 'overdraw'
  | 'swarmSense'
  | 'catalyst'
  | 'condensate'
  | 'forcing'
  | 'pressurize'
  | 'recycle'
  | 'preempt'
  | 'reprocess'
  | 'preserve'

export type PolicyDef = {
  id: PolicyId
  name: string
  /** ランク r のときの説明 */
  detail: (rank: number) => string
  /** 何度でも取れるか。false なら 1 回だけ */
  stackable: boolean
  maxRank: number
}

export const POLICIES: PolicyDef[] = [
  {
    id: 'overdraw',
    name: '過剰採取',
    detail: (r) => `手動採取の ${Math.min(75, 25 * r)}% が 2 倍になる`,
    stackable: true,
    maxRank: 3,
  },
  {
    id: 'swarmSense',
    name: '群体感知',
    detail: (r) => `在庫の検体 10 体につき手動採取 +${2 * r}%（上限 +${200 * r}%）`,
    stackable: true,
    maxRank: 3,
  },
  {
    id: 'catalyst',
    name: '触媒投与',
    detail: (r) => `突然変異の発現率 ×${(1 + 0.15 * r).toFixed(2)}`,
    stackable: true,
    maxRank: 3,
  },
  {
    id: 'condensate',
    name: '培養液の濃縮',
    detail: (r) => `培養液の自動生産 ×${(1 + 0.22 * r).toFixed(2)}`,
    stackable: true,
    maxRank: 4,
  },
  {
    id: 'forcing',
    name: '促成培養',
    detail: (r) => `検体の生産速度 ×${(1 + 0.2 * r).toFixed(2)}`,
    stackable: true,
    maxRank: 4,
  },
  {
    id: 'pressurize',
    name: '加圧射出',
    detail: (r) => `投入速度 ×${(1 + 0.18 * r).toFixed(2)}`,
    stackable: true,
    maxRank: 4,
  },
  {
    id: 'recycle',
    name: '検体の再利用',
    detail: (r) => `投入した検体の ${6 * r}% が在庫へ戻る`,
    stackable: true,
    maxRank: 3,
  },
  {
    id: 'preempt',
    name: '実験の前倒し',
    detail: (r) => `次の突然変異までの必要数 −${Math.min(45, 15 * r)}%`,
    stackable: true,
    maxRank: 3,
  },
  {
    id: 'reprocess',
    name: '廃液の再処理',
    detail: (r) => `検体 1 体の生産に要する培養液 −${Math.min(45, 15 * r)}%`,
    stackable: true,
    maxRank: 3,
  },
  {
    id: 'preserve',
    name: '標本の保存',
    detail: (r) => `ラン終了時の研究予算 +${15 * r}%`,
    stackable: true,
    maxRank: 3,
  },
]

export const POLICY_BY_ID = new Map(POLICIES.map((p) => [p.id, p]))

export type PolicyRanks = Map<PolicyId, number>

export type PolicyEffects = {
  /** 手動採取が 2 倍になる確率 */
  clickCrit: number
  /** 在庫 10 体あたりのクリック倍率加算 */
  clickPerStock: number
  /** その上限 */
  clickPerStockCap: number
  mutationRateMult: number
  cultureMult: number
  sharkRateMult: number
  launchMult: number
  /** 投入した検体が在庫へ戻る確率 */
  recycle: number
  /** 突然変異のしきい値にかける倍率 */
  draftThresholdMult: number
  /** 検体 1 体の培養液コストにかける倍率 */
  sharkCostMult: number
  budgetMult: number
}

export function policyEffects(ranks: PolicyRanks): PolicyEffects {
  const r = (id: PolicyId) => ranks.get(id) ?? 0
  return {
    clickCrit: Math.min(0.75, 0.25 * r('overdraw')),
    clickPerStock: 0.02 * r('swarmSense'),
    clickPerStockCap: 2 * r('swarmSense'),
    mutationRateMult: 1 + 0.15 * r('catalyst'),
    cultureMult: 1 + 0.22 * r('condensate'),
    sharkRateMult: 1 + 0.2 * r('forcing'),
    launchMult: 1 + 0.18 * r('pressurize'),
    recycle: Math.min(0.35, 0.06 * r('recycle')),
    draftThresholdMult: Math.max(0.55, 1 - 0.15 * r('preempt')),
    sharkCostMult: Math.max(0.55, 1 - 0.15 * r('reprocess')),
    budgetMult: 1 + 0.15 * r('preserve'),
  }
}

export const EMPTY_POLICY_EFFECTS = policyEffects(new Map())
