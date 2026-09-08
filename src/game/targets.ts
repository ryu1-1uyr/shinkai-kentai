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

/**
 * 深度ごとの呼称。
 * 通常建築物とボスで語彙のプールを分け、そこから無作為に選ぶ。
 * 同じ深度でもランごとに名前が変わり、周回の表情が増える。
 */
export type DepthNames = { zone: string; normal: string[]; boss: string[] }

const DEPTH_NAMES: DepthNames[] = [
  {
    zone: '沿岸の町',
    normal: ['民家', '海の家', '灯台守の小屋', '漁協', '桟橋', '民宿'],
    boss: ['灯台', '防波堤', '漁港の管制塔'],
  },
  {
    zone: '地方都市',
    normal: ['アパート', '商店街', '診療所', '小学校', '郵便局', '公民館'],
    boss: ['ショッピングモール', '市民ホール', '駅ビル'],
  },
  {
    zone: '県庁所在地',
    normal: ['オフィスビル', '立体駐車場', 'ホテル', '図書館', '総合病院', '専門学校'],
    boss: ['国際空港', '県庁舎', '巨大水族館'],
  },
  {
    zone: '大都市',
    normal: ['高層ビル', 'タワーマンション', '地下街', '高架橋', '球場', '複合商業施設'],
    boss: ['海上都市', '超高層タワー', '湾岸コンビナート'],
  },
  {
    zone: '首都',
    normal: ['官庁街', '中央銀行', '放送局', '大使館', '議員会館', '中央市場'],
    boss: ['国会議事堂', '中央省庁', '迎賓館'],
  },
  {
    zone: '軍事拠点',
    normal: ['格納庫', '弾薬庫', 'レーダー基地', '滑走路', '兵舎', '燃料タンク'],
    boss: ['原子力空母', '戦略司令部', '弾道ミサイル基地'],
  },
  {
    zone: '大陸沿岸',
    normal: ['都市圏', '工業港', '火力発電所', '製油所', '貨物ターミナル', '造船所'],
    boss: ['大陸間橋梁', '巨大防潮堤', '海底トンネル'],
  },
  {
    zone: '内陸部',
    normal: ['工業地帯', '貯水池', '送電網', '鉱山', '穀倉地帯', '内陸空港'],
    boss: ['超大型ダム', '地下都市', '大陸横断鉄道'],
  },
  {
    zone: '海溝',
    normal: ['深海基地', '潜水艇ドック', '熱水プラント', '観測ブイ', '海底ケーブル', '沈没船'],
    boss: ['古代遺跡', '沈没艦隊', '未知の巨大生物'],
  },
  {
    zone: '海溝底',
    normal: ['熱水噴出孔', '冷水湧出帯', '深海平原', '骸の丘', '巨大貝床', '無名の窪地'],
    boss: ['未確認構造物', '深淵の門', '石化した何か'],
  },
  {
    zone: '成層圏 ※深度計異常',
    normal: ['積乱雲', '気象観測気球', '旅客機', '送電鉄塔', '山頂の観測所', '雷雲'],
    boss: ['サメ竜巻', '超巨大積乱雲', '台風の目'],
  },
  {
    zone: '中間圏 ※深度計異常',
    normal: ['気象観測機', '流星群', '高高度気球', '電離層', '極光', '観測ロケット'],
    boss: ['気象衛星', '成層圏プラットフォーム', '極超音速機'],
  },
  {
    zone: '軌道上 ※査読非通過',
    normal: ['通信衛星', '宇宙ごみ', '補給船', '太陽電池パネル', '観測衛星', '使用済み上段'],
    boss: ['軌道エレベータ', '宇宙ステーション', '月面基地'],
  },
]

const UNKNOWN: DepthNames = {
  zone: '深宇宙 ※記録なし',
  normal: ['未知の構造体', '漂流物', '記録にない衛星', '座標のない残骸', '名前のない塊'],
  boss: ['未知の巨大構造体', '名前のない何か', '査読を通らなかったもの'],
}

export function depthNames(depth: number): DepthNames {
  const i = Math.min(Math.max(1, depth), DEPTH_NAMES.length) - 1
  return depth > DEPTH_NAMES.length ? UNKNOWN : DEPTH_NAMES[i]
}

/** 深度の呼称だけが欲しいとき */
export function depthName(depth: number): { zone: string } {
  return { zone: depthNames(depth).zone }
}
