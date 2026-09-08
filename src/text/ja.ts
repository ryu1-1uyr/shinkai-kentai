/*
 * 画面に出る文字をすべてここに集める。
 *
 * 目的は 2 つ。
 *  1. 語彙をまとめて見直せること。名前・説明・ログの言い回しが 1 か所に並ぶ
 *  2. 翻訳するとき、この 1 枚を差し替えるだけで済むこと
 *
 * `{name}` のような波括弧は差し込みの位置。数式はコードに残し、
 * ここには**文言だけ**を置く。差し込みは text/index.ts の fill() が行う。
 *
 * 開発用パネル（DebugPanel / SpriteLab）の文字は入れていない。
 * 本番ビルドから丸ごと消えるうえ、プレイヤーには見えないため。
 */
export const ja = {
  app: {
    title: '深海検体増殖計画',
  },

  phase: {
    culture: '培養フェーズ',
    invasion: '侵略フェーズ',
    cultureTank: '培養槽',
    safe: '安全',
    depth: '深度 {depth}',
    standby: '検体を増やせ',
    untilInvasion: '侵略開始まで',
  },

  resource: {
    title: '資源',
    culture: '培養液',
    shark: '検体',
    score: '戦果',
    produced: '累計生産',
    unitShark: '体',
    unitKind: '{n} 種',
    launchRate: '投入 {rate}/s',
    perClick: '+{value} / クリック',
    crit: '会心 {chance}% ×{mult}',
    collect: '培養液を採取',
  },

  gauge: {
    mutation: '突然変異',
    policy: '研究方針',
    remaining: 'あと {left}{unit}',
    done: '打ち止め',
  },

  speed: {
    manual: '手動',
    autoBuyOne: '定期発注',
    autoBuyAll: 'AI 発注',
  },

  reserve: {
    ready: '予備電源 +{sec}s',
    spent: '予備電源 使用済み',
  },

  building: {
    title: '設備',
    owned: '所持 {n}',
    autoBuyHint: '定期発注の対象にする',
    autoBuyLabel: '{name}を定期発注する',
    tank: { name: '培養槽', effect: '培養液 +1.0/s・クリック +{bonus}' },
    feeder: { name: '給餌装置', effect: '培養液 +10/s' },
    breeder: { name: '繁殖槽', effect: 'サメ +0.8/s（培養液 {cost}/体）' },
    accelerator: { name: '加速炉', effect: 'サメ生産 +20%' },
    launcher: { name: '射出管', effect: '投入速度 +15/s' },
  },

  shark: {
    plain: '通常サメ',
    suffix: 'サメ',
  },

  // 表として読むために整形を止めている（1 行 = 1 変異）
  // prettier-ignore
  mutation: {
    glow:        { name: '発光', prefix: '発光' },
    frenzy:      { name: '凶暴化', prefix: '狂乱' },
    swift:       { name: '高速遊泳', prefix: 'スイフト' },
    albino:      { name: '白化', prefix: 'アルビノ' },
    spike:       { name: '棘皮', prefix: 'スパイク' },
    poison:      { name: '猛毒', prefix: 'ポイズン' },
    twinHead:    { name: '双頭化', prefix: 'デュアルヘッド' },
    tripleHead:  { name: '三頭化', prefix: 'トリプルヘッド' },
    swarm:       { name: 'ダブル', prefix: 'ダブル' },
    triple:      { name: 'トリプル', prefix: 'トリプル' },
    giant:       { name: '巨大化', prefix: '巨大' },
    fungus:      { name: '菌類化', prefix: 'キノコ' },
    ghost:       { name: '幽体化', prefix: 'ゴースト' },
    zombie:      { name: '屍化', prefix: 'ゾンビ' },
    ancient:     { name: '超古代', prefix: 'エンシェント' },
    pressure:    { name: '高圧適応', prefix: '深圧' },
    abyss:       { name: '深淵種', prefix: 'アビス' },
    tentacle:    { name: '触手化', prefix: 'タコ' },
    eldritch:    { name: '古代神性', prefix: '邪神' },
    armor:       { name: '装甲化', prefix: 'アーマード' },
    mecha:       { name: '機械化', prefix: 'メカ' },
    volt:        { name: '帯電化', prefix: 'サンダー' },
    autonomous:  { name: '機械兵装', prefix: '機械兵装' },
    zeroG:       { name: '飛行', prefix: 'フライング' },
    meteor:      { name: '隕石', prefix: 'メテオ' },
    cosmic:      { name: '宇宙適応', prefix: 'コズミック' },
    alien:       { name: 'エイリアン', prefix: 'エイリアン' },
    tornado:     { name: '竜巻化', prefix: 'トルネード' },
    magma:       { name: '灼熱', prefix: 'マグマ' },
    frozen:      { name: '氷結', prefix: 'フローズン' },
    storm:       { name: '暴風', prefix: 'ストーム' },
    tsunami:     { name: '大津波', prefix: 'ツナミ' },
  },

  family: {
    bio: '生体系',
    abyss: '深海系',
    mech: '機械系',
    cosmic: '宇宙系',
    disaster: '災害系',
  },

  depth: [
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
    {
      zone: '深宇宙 ※記録なし',
      normal: ['未知の構造体', '漂流物', '記録にない衛星', '座標のない残骸', '名前のない塊'],
      boss: ['未知の巨大構造体', '名前のない何か', '査読を通らなかったもの'],
    },
  ],

  policy: {
    overdraw: { name: '過剰採取', detail: '手動採取が {pct}% の確率で会心する' },
    swarmSense: { name: '群体感知', detail: '在庫の検体 10 体につき手動採取 +{pct}%（上限 +{cap}%）' },
    catalyst: { name: '触媒投与', detail: '突然変異の発現率 ×{mult}' },
    condensate: { name: '培養液の濃縮', detail: '培養液の自動生産 ×{mult}' },
    forcing: { name: '促成培養', detail: '検体の生産速度 ×{mult}' },
    pressurize: { name: '加圧射出', detail: '投入速度 ×{mult}' },
    recycle: { name: '検体の再利用', detail: '投入した検体の {pct}% が在庫へ戻る' },
    preempt: { name: '実験の前倒し', detail: '次の突然変異までの必要数 −{pct}%' },
    reprocess: { name: '廃液の再処理', detail: '検体 1 体の生産に要する培養液 −{pct}%' },
    preserve: { name: '標本の保存', detail: 'ラン終了時の研究予算 +{pct}%' },
  },

  upgrade: {
    clickPower: { name: 'クリック増幅', detail: '培養液の手動採取 ×{mult}' },
    extraReroll: { name: '予備実験枠', detail: 'ドラフトの引き直しが 1 ラン に {n} 回になる' },
    critChance: { name: '採取の勘', detail: '手動採取の {pct}% が会心になる' },
    critPower: { name: '一点集中', detail: '会心した採取が ×{mult}' },
    startTanks: { name: '培養槽の常設', detail: '開始時に培養槽を {n} 個持つ' },
    cultureRate: { name: '培養液生産', detail: '培養液の自動生産 ×{mult}' },
    sharkRate: { name: '繁殖効率', detail: '検体の生産速度 ×{mult}' },
    startSharks: { name: '検体の備蓄', detail: '開始時に検体を {n} 体持つ' },
    launchRate: { name: '射出機構', detail: '投入速度 ×{mult}' },
    sharkPower: { name: '基礎戦闘力', detail: '全検体の戦闘力 ×{mult}' },
    endlessCulture: { name: '過剰培養', detail: '培養液の生産 ×{mult}' },
    endlessBreed: { name: '過剰繁殖', detail: '検体の生産速度 ×{mult}' },
    endlessLaunch: { name: '過剰射出', detail: '投入速度 ×{mult}' },
    endlessPower: { name: '過剰改造', detail: '全検体の戦闘力 ×{mult}' },
  },

  unlock: {
    family_abyss: {
      name: '深海系の解禁',
      detail: '高圧適応・深淵種・触手化・古代神性がドラフトに追加される',
    },
    family_mech: {
      name: '機械系の解禁',
      detail: '装甲化・機械化・帯電化・自律兵装がドラフトに追加される',
    },
    family_cosmic: {
      name: '宇宙系の解禁',
      detail: '無重力・隕石化・宇宙化・エイリアンがドラフトに追加される',
    },
    family_disaster: {
      name: '災害系の解禁',
      detail: '竜巻化・灼熱・氷結・暴風・大津波がドラフトに追加される',
    },
    speed2: { name: '倍速 ×2', detail: '実験の進行を 2 倍速にできる' },
    speed4: { name: '倍速 ×4', detail: '実験の進行を 4 倍速にできる' },
    doubleClick: { name: 'ダブルクリック', detail: '手動採取で得られる培養液が 2 倍になる' },
    autoClick: { name: '自動採取装置', detail: '毎秒 5 回ぶんの培養液を自動で採取する（会心はしない）' },
    autoBuyOne: { name: '定期発注', detail: '設備を 1 種類だけ選んで自動購入できる（選び直しは自由）' },
    autoBuyAll: { name: 'AI 発注', detail: '買える設備をすべて自動で購入する（オン / オフ切り替え可）' },
    analysis: { name: '解析装置', detail: '突然変異の発現率と戦闘力倍率が読めるようになる' },
    reroll: { name: '再実験', detail: 'ドラフトを 1 ラン に 1 回だけ引き直せる' },
    earlyDraft: { name: '早期実験', detail: '最初のドラフトが累計 10 体で訪れる（通常は 50 体）' },
    extraOffer: { name: '追加検体枠', detail: 'ドラフトの提示が 3 枚から 4 枚になる' },
    prototype: { name: '試作認可', detail: '突然変異のランク上限が 3 から 4 になる' },
    lastStand: { name: '緊急浮上', detail: 'ラン終了時、在庫の検体をすべて投入してから終わる' },
    reservePower: { name: '予備電源', detail: '制限時間が尽きた瞬間、1 ラン に 1 回だけ +20 秒' },
    chainCollapse: { name: '連鎖崩壊', detail: '建物を破壊した際の余剰ダメージが、次の建物に 2 倍で通る' },
    tankSynergy: { name: '温度管理', detail: '培養槽 1 個につき培養液の生産 +2%' },
    feederSynergy: { name: '給餌連動', detail: '給餌装置 1 個につき培養液の生産 +3%' },
    breederSynergy: { name: '過密飼育', detail: '繁殖槽 1 個につき検体の生産速度 +2%' },
    launcherSynergy: { name: '射出斉射', detail: '射出管 1 個につき投入速度 +3%' },
  },

  branch: {
    prod: { name: '培養', sub: '培養液を増やす' },
    spec: { name: '検体', sub: '検体を増やし強くする' },
    raid: { name: '侵略', sub: '投入と破壊を伸ばす' },
    lab: { name: '実験', sub: 'ドラフトを操作する' },
    fam: { name: '系統', sub: '変異の種類を解禁する' },
    ops: { name: '運用', sub: '周回を速くする' },
    over: { name: '超過', sub: '際限なく積み増す' },
  },

  log: {
    title: '観測記録',
    emptyCulture: 'まだ記録がない。検体を生産すると実験機会が訪れる。',
    emptyInvasion: 'まだ記録がない。',
    depth: '深度 {depth} — {zone}',
    bossAppear: '{name} が出現',
    bossDown: '{name} を破壊',
    hit: '{name} を破壊  {done}/{total}',
    birth: '{name} が誕生',
    record: 'より強力なサメ {name} が誕生',
    draft: '{name} を確認  R{rank}',
    policy: '{name} を採用  R{rank}',
    reserve: '予備電源が作動  +{sec} 秒',
    lastStand: '緊急浮上 — 残存する検体をすべて投入',
    traced: '逆探知が完了。軌道より照射を確認',
  },

  draft: {
    mutationTitle: '突然変異を確認',
    mutationSub: '累計 {n} 体を生産。以降に生まれる検体にのみ発現する（在庫の個体は変異しない）',
    policyTitle: '研究方針を決定',
    policySub: '培養液を累計 {n} 採取。実験の進め方を選ぶ（施設に作用する）',
    reroll: '↻ 引き直す（残り {n} 回）',
    effect: '発現率 {rate}% ／ 戦闘力 ×{power}',
    unknown: '未解析 — 希少度だけが手がかり',
    upgrade: 'R{from} → R{to} に強化（発現率も倍率も上がる）',
  },

  stock: {
    mutationTitle: '保有している突然変異',
    mutationEmpty: 'まだ変異は発現していない。検体を生産すると実験機会が訪れる。',
    title: '検体在庫',
    note: '生産した端から出撃していくため、在庫はほぼゼロで推移する。',
    empty: 'まだ検体がいない。培養液を集めて生産を始める。',
    rest: 'その他 {n} 種',
  },

  invasion: {
    idleNote: '検体は投入するまで失われない。いま生産した分はそのまま戦力になる。',
    destroyed: '破壊 {done} / {total}',
    clearedDepth: '突破深度 {n}',
    viewerEmpty: '投入できる検体がない — 繁殖槽を増やせ',
    flashTitle: '深度計 異常',
    flashSub: '計器は上昇を示している。報告書上は正常として処理する。',
  },

  result: {
    title: '施設が逆探知されました',
    sub: '軌道上より照射を確認。研究施設は消失。実験記録のみが残された。',
    clearedDepth: '突破深度',
    zone: '到達地点',
    score: '総戦果',
    elapsed: '経過時間',
    produced: '検体生産数',
    award: '研究予算',
    championTitle: '今回の最高到達サメ',
    championInfo: '変異 {traits} 種 / 戦闘力 {power} / {count} 体',
    speciesTitle: '実験記録 — 生み出した検体',
    toLab: '研究所へ',
  },

  lab: {
    title: '研究所',
    budget: '研究予算',
    affordable: 'いま {n} 件 取得できる',
    affordableNone: '取得できる強化はない',
    runs: '実験回数 {n}',
    bestDepth: '最高突破深度 {n}',
    lifetime: '累計予算 {n}',
    start: '次の実験を開始する',
    taken: '取得済み',
    short: 'あと {n}',
    max: 'MAX',
  },
} as const
