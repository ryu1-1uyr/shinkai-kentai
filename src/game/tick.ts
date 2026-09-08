import type { Config } from './config.ts'
import { BUILDINGS, BUILDING_INDEX } from './buildings.ts'
import { addSharks, launchWeakest, totalSharks } from './inventory.ts'
import {
  hasMutation,
  MUTATIONS,
  type MutationDef,
  type MutationId,
  type MutationMask,
  maskOf,
  nameOfMask,
  offerWeight,
  powerOfMask,
} from './mutations.ts'
import { POLICIES, type PolicyDef } from './policies.ts'
import { type GameState, pushLog, refreshBirthDist, refreshPolicyFx, rng } from './state.ts'
import { bossHp, depthNames, perDepthTime, targetCount, targetHp } from './targets.ts'

/** そのティックのプレイヤー入力。シミュレータでは方針関数が埋める */
export type TickInput = {
  clicksPerSec: number
}

/**
 * 記録に残す価値のある個体か。
 * **rare 以上を含み、かつ変異を 3 つ以上併せ持つ**個体だけを対象にする。
 * 条件を緩めると記録が誕生ログで埋まって、破壊や深度突破が読めなくなる。
 */
function isNotable(mask: MutationMask): boolean {
  let count = 0
  let hasRare = false
  for (const m of MUTATIONS) {
    if (!hasMutation(mask, m)) continue
    count++
    if (m.rarity === 'rare' || m.rarity === 'legendary') hasRare = true
  }
  return hasRare && count >= 3
}

/** 設備の所持数 */
function owned(s: GameState, id: string): number {
  const i = BUILDING_INDEX.get(id as never)
  return i === undefined ? 0 : s.buildings[i]
}

export function cultureRate(s: GameState): number {
  let r = 0
  BUILDINGS.forEach((b, i) => {
    if (b.cultureRate) r += b.cultureRate * s.buildings[i]
  })
  // 設備連動は所持数に依存するため、恒久強化の固定倍率とは別に掛ける
  let synergy = 1
  if (s.meta.tankSynergy) synergy *= 1 + owned(s, 'tank') * 0.02
  if (s.meta.feederSynergy) synergy *= 1 + owned(s, 'feeder') * 0.03
  return r * s.meta.cultureMult * synergy * s.policyFx.cultureMult
}

export function clickValue(s: GameState, cfg: Config): number {
  let tanks = 0
  BUILDINGS.forEach((b, i) => {
    if (b.clickBonus) tanks += s.buildings[i]
  })
  // 群体感知: 在庫の検体数に応じてクリックが伸びる。
  // これがあると、序盤しか効かなかったクリックが後半まで意味を持つ
  const fx = s.policyFx
  const stock =
    fx.clickPerStock > 0
      ? Math.min(fx.clickPerStockCap, (totalSharks(s.inv) / 10) * fx.clickPerStock)
      : 0
  return cfg.click.base * (1 + tanks * cfg.click.perTankBonus) * s.meta.clickMult * (1 + stock)
}

/** 手動採取が会心する確率。恒久強化と研究方針「過剰採取」を足して 90% で頭打ち */
export function critChance(s: GameState): number {
  return Math.min(0.9, s.meta.critChance + s.policyFx.clickCrit)
}

export function critMult(s: GameState): number {
  return s.meta.critMult
}

/**
 * 会心を均した手動採取 1 回の期待値。
 *
 * 会心を**手動採取にだけ**乗せているのは、能動的に叩く操作を
 * 自動生産より割の良いものにするため。自動採取装置は会心しない。
 */
export function clickEV(s: GameState, cfg: Config): number {
  return clickValue(s, cfg) * (1 + critChance(s) * (critMult(s) - 1))
}

export function sharkRate(s: GameState): number {
  let base = 0
  let mult = 1
  BUILDINGS.forEach((b, i) => {
    if (b.sharkRate) base += b.sharkRate * s.buildings[i]
    if (b.sharkRateMult) mult += b.sharkRateMult * s.buildings[i]
  })
  const synergy = s.meta.breederSynergy ? 1 + owned(s, 'breeder') * 0.02 : 1
  return base * mult * s.meta.sharkRateMult * synergy * s.policyFx.sharkRateMult
}

export function launchRate(s: GameState, cfg: Config): number {
  let r = cfg.invasion.baseLaunchRate
  BUILDINGS.forEach((b, i) => {
    if (b.launchRate) r += b.launchRate * s.buildings[i]
  })
  const synergy = s.meta.launcherSynergy ? 1 + owned(s, 'launcher') * 0.03 : 1
  return r * s.meta.launchMult * synergy * s.policyFx.launchMult
}

/**
 * ドラフトで提示する候補を選ぶ。
 * 重みは累計生産数に依存し、生産が伸びるほどレアな変異が出やすくなる。
 * 取得済みの変異も最大ランク未満なら再提示される。
 */
function rollOffers(s: GameState, cfg: Config): MutationDef[] {
  const pool = MUTATIONS.filter(
    (m) => s.meta.families.has(m.family) && (s.ranks.get(m.id) ?? 0) < s.meta.maxRank,
  )
  const offers: MutationDef[] = []
  const picked = new Set<MutationId>()
  const size = Math.min(cfg.mutation.draftSize + s.meta.extraOffers, pool.length)
  while (offers.length < size) {
    const avail = pool.filter((m) => !picked.has(m.id))
    let total = 0
    for (const m of avail) total += offerWeight(m, s.producedTotal)
    if (total <= 0) {
      // どの変異も重みを持たないほど生産が少ない場合はコモンから引く
      const fallback = avail[Math.floor(rng(s) * avail.length)]
      picked.add(fallback.id)
      offers.push(fallback)
      continue
    }
    let r = rng(s) * total
    for (const m of avail) {
      r -= offerWeight(m, s.producedTotal)
      if (r <= 0) {
        picked.add(m.id)
        offers.push(m)
        break
      }
    }
  }
  return offers
}

/** 研究方針の候補を選ぶ。上限に達していないものから無作為に */
function rollPolicies(s: GameState, cfg: Config): PolicyDef[] {
  const pool = POLICIES.filter((p) => (s.policies.get(p.id) ?? 0) < p.maxRank)
  const offers: PolicyDef[] = []
  const picked = new Set<string>()
  const size = Math.min(cfg.policy.draftSize, pool.length)
  while (offers.length < size) {
    const cand = pool[Math.floor(rng(s) * pool.length)]
    if (picked.has(cand.id)) continue
    picked.add(cand.id)
    offers.push(cand)
  }
  return offers
}

function beginDepth(s: GameState, cfg: Config): void {
  // 同じ深度でもランごとに標的の名前が変わるよう、入るたびにプールから引く
  const names = depthNames(s.depth)
  s.normalName = names.normal[Math.floor(rng(s) * names.normal.length)]
  s.bossName = names.boss[Math.floor(rng(s) * names.boss.length)]
  s.destroyed = 0
  s.onBoss = false
  s.currentHp = targetHp(s.depth, cfg)
  if (cfg.invasion.timerModel === 'perDepth') {
    s.timeLeft = perDepthTime(s.depth, cfg)
  }
}

/**
 * 現在の標的が壊れたときの遷移。余剰ダメージは次の標的へ持ち越す。
 * mult は連鎖崩壊の倍率で、1 回の投入につき最初の 1 回だけ 2 になる。
 * 破壊のたびに倍率を掛けると 2 のべき乗で暴走し、HP の伸び（深度あたり 5 倍）を
 * 一瞬で突き抜けてしまうため、連鎖はさせない。
 */
function advanceTarget(s: GameState, cfg: Config, overkill: number, mult: number): number {
  if (s.onBoss) {
    // 深度突破
    pushLog(s, 'boss', `${s.bossName} を破壊`)
    s.clearedDepth += 1
    if (cfg.invasion.timerModel === 'runWide') {
      s.timeLeft += cfg.invasion.runWideBonusPerDepth
    }
    s.depth += 1
    beginDepth(s, cfg)
    pushLog(s, 'depth', `深度 ${s.depth} — ${depthNames(s.depth).zone}`)
    return overkill * mult
  }
  s.destroyed += 1
  if (s.destroyed >= targetCount(s.depth, cfg)) {
    pushLog(s, 'boss', `${s.bossName} が出現`)
    s.onBoss = true
    s.currentHp = bossHp(s.depth, cfg)
  } else {
    pushLog(s, 'hit', `${s.normalName} を破壊  ${s.destroyed}/${targetCount(s.depth, cfg)}`)
    // 同じ深度の中でも、次の標的は別の建物にする
    const pool = depthNames(s.depth).normal
    s.normalName = pool[Math.floor(rng(s) * pool.length)]
    s.currentHp = targetHp(s.depth, cfg)
  }
  return overkill * mult
}

export function tick(s: GameState, input: TickInput, cfg: Config): void {
  // ドラフト提示中は選択されるまで一切進行しない
  if (s.phase === 'over' || s.pendingDraft) return
  const dt = 1 / cfg.tickHz
  s.t += dt

  // --- 培養液 ---
  const gained =
    cultureRate(s) * dt +
    clickEV(s, cfg) * input.clicksPerSec * dt +
    clickValue(s, cfg) * s.meta.autoClick * dt
  s.culture += gained
  s.cultureTotal += gained

  // --- サメ生産 ---
  const want = sharkRate(s) * dt
  const sharkCost = cfg.shark.cultureCost * s.policyFx.sharkCostMult
  const affordable = s.culture / sharkCost
  const born = Math.min(want, affordable)
  if (born > 0) {
    s.culture -= born * sharkCost
    s.producedTotal += born
    for (const [mask, p] of s.birthDist) {
      addSharks(s.inv, mask, born * p)
      const before = s.births.get(mask) ?? 0
      const after = before + born * p
      s.births.set(mask, after)
      // 1 体目が生まれた瞬間だけ、珍しい個体を記録に残す
      if (before < 1 && after >= 1 && isNotable(mask)) {
        pushLog(s, 'birth', `${nameOfMask(mask)} が誕生`, mask)
      }
    }
  }

  // --- ドラフト ---
  // 提示だけ行い、選択されるまで進行を止める（選択は applyDraft が行う）。
  // 両方が同時に条件を満たしたときは変異を先に出し、方針は次のティックまで待つ。
  if (s.producedTotal >= s.nextDraftAt) {
    const offers = rollOffers(s, cfg)
    if (offers.length === 0) s.nextDraftAt = Infinity
    else {
      s.pendingDraft = { kind: 'mutation', offers }
      return
    }
  }
  if (s.cultureTotal >= s.nextPolicyAt) {
    const offers = rollPolicies(s, cfg)
    if (offers.length === 0) s.nextPolicyAt = Infinity
    else {
      s.pendingDraft = { kind: 'policy', offers }
      return
    }
  }

  // --- フェーズ遷移 ---
  if (s.phase === 'culture' && s.t >= cfg.culturePhaseSec) {
    s.phase = 'invasion'
    pushLog(s, 'depth', `深度 ${s.depth} — ${depthNames(s.depth).zone}`)
    s.timeLeft = cfg.invasion.timerModel === 'runWide' ? cfg.invasion.runWideBase : 0
    beginDepth(s, cfg)
  }

  if (s.phase !== 'invasion') return

  // --- 侵略 ---
  const n = launchRate(s, cfg) * dt
  const { launched, damage } = launchWeakest(s.inv, n, s.ranks, cfg)
  // 検体の再利用: 投入した個体の一部が在庫へ戻る
  if (s.policyFx.recycle > 0 && launched > 0) addSharks(s.inv, 0, launched * s.policyFx.recycle)
  applyDamage(s, cfg, damage)

  // --- タイマー ---
  s.timeLeft -= dt
  if (s.timeLeft <= 0) {
    if (s.meta.reserveSeconds > 0 && !s.reserveUsed) {
      // 予備電源。逆探知の完了を 1 回だけ遅らせる
      s.reserveUsed = true
      s.timeLeft += s.meta.reserveSeconds
      pushLog(s, 'system', `予備電源が作動  +${s.meta.reserveSeconds} 秒`)
    } else {
      if (s.meta.lastStand) {
        pushLog(s, 'system', '緊急浮上 — 残存する検体をすべて投入')
        finalVolley(s, cfg)
      }
      pushLog(s, 'system', '逆探知が完了。軌道より照射を確認')
      s.phase = 'over'
      s.endReason = 'timeout'
    }
  }
}

/** 与えたダメージを標的に通す。破壊したら余剰を次の標的へ持ち越す */
function applyDamage(s: GameState, cfg: Config, damage: number): void {
  let dmg = damage
  let chained = false
  let guard = 0
  while (dmg > 0 && guard++ < 1000) {
    if (dmg < s.currentHp) {
      s.currentHp -= dmg
      s.score += dmg
      dmg = 0
    } else {
      s.score += s.currentHp
      const over = dmg - s.currentHp
      const mult = chained ? 1 : s.meta.overkillMult
      chained = true
      dmg = advanceTarget(s, cfg, over, mult)
    }
  }
}

/** 緊急浮上。ラン終了の瞬間に在庫の検体をすべて投入する */
function finalVolley(s: GameState, cfg: Config): void {
  const all = totalSharks(s.inv)
  if (all <= 0) return
  const { damage } = launchWeakest(s.inv, all, s.ranks, cfg)
  applyDamage(s, cfg, damage)
}

/** 提示中のドラフトを引き直す。1 ラン に使える回数は恒久強化で決まる */
export function rerollDraft(s: GameState, cfg: Config): boolean {
  const d = s.pendingDraft
  if (!d || s.rerollsLeft <= 0) return false
  s.rerollsLeft -= 1
  s.pendingDraft =
    d.kind === 'mutation'
      ? { kind: 'mutation', offers: rollOffers(s, cfg) }
      : { kind: 'policy', offers: rollPolicies(s, cfg) }
  return true
}

/** 提示中のドラフトから 1 枚選んで確定する */
export function applyDraft(s: GameState, cfg: Config, index: number): void {
  const d = s.pendingDraft
  if (!d || d.offers.length === 0) return
  const i = Math.max(0, Math.min(index, d.offers.length - 1))

  if (d.kind === 'mutation') {
    const chosen = d.offers[i]
    s.ranks.set(chosen.id, (s.ranks.get(chosen.id) ?? 0) + 1)
    refreshBirthDist(s, cfg)
    pushLog(s, 'draft', `${chosen.name} を確認  R${s.ranks.get(chosen.id)}`, maskOf(chosen))
    s.draftCount += 1
    s.nextDraftAt +=
      cfg.mutation.draftThresholdBase *
      Math.pow(cfg.mutation.draftThresholdGrowth, s.draftCount) *
      s.policyFx.draftThresholdMult
  } else {
    const chosen = d.offers[i]
    s.policies.set(chosen.id, (s.policies.get(chosen.id) ?? 0) + 1)
    refreshPolicyFx(s)
    refreshBirthDist(s, cfg)
    pushLog(s, 'policy', `${chosen.name} を採用  R${s.policies.get(chosen.id)}`)
    s.policyCount += 1
    s.nextPolicyAt +=
      cfg.policy.thresholdBase * Math.pow(cfg.policy.thresholdGrowth, s.policyCount)
  }
  s.pendingDraft = null
}
