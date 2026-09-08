# 報酬と動機づけ

「ドーパミンを出させる方法」を調べたが、**まず前提を正しておく必要がある**。
そのうえで、実際に効く仕組みと、踏み越えない方がいい線を整理する。

## 1. 前提の訂正 — ドーパミンは「快感」ではない

一般に言われる「ドーパミンが出る＝気持ちいい」は不正確。
神経科学の知見はこうなっている。

> ドーパミンニューロンは報酬そのものではなく、**報酬予測誤差**
> （予期した報酬と実際に得た報酬の差）を信号として発する。
> 最も強い活性化は、**報酬が予測を上回ったとき**に起きる。

つまり設計者が作るべきは「報酬」ではなく「**予測とのズレ**」。

これは実務的に大きな含意がある。

- **予測通りの報酬は、繰り返すほど信号が弱まる。**
  同じ強化を同じ間隔で与え続けると、快感は逓減する
- **驚きが要る。** ただし常に驚かせると、それが予測になる
- 逆に言えば、**予測を作らせてから外す**のが効く。
  期待値を学習させる期間が必要

## 2. 変動比率強化（Variable Ratio）

報酬が予測できないことによって強化が効く、という古典的な仕組み。

- ランダムな手続きは変動比率スケジュールと見なせ、報酬予測誤差を引き起こす
- **報酬予測誤差が強化学習の機構として働くのは、強化が予測不能なときだけ**
- 実験では、**変動比率**で与えられた金銭報酬に対して線条体のドーパミン放出が観測されたが、
  **固定比率**では有意な放出が検出されなかった

ゲームでの実装がルートボックスやランダムドロップ。
「最も強力な行動強化は一貫した報酬ではなく、**報酬の不確実性**によって生じる」と
まとめられている。

## 3. Vampire Survivors に見る具体的な適用

BAFTA を獲ったこのタイトルは、開発者がギャンブル業界出身であることが指摘されている。
「この心理的な訴求は偶然ではない」と記事が明言している。

抽出されていた仕組み:

| 仕組み               | 内容                                                                                    |
| -------------------- | --------------------------------------------------------------------------------------- |
| **多層の変動報酬**   | ラン中に金貨を集め、ラン間で能力に変える。周期の異なる報酬が重なる                      |
| **ニアミス効果**     | 「30 分に届かなかったランすべてがこの感覚を引き起こす」。惜しい負けが即座の再挑戦を促す |
| **勝利に見える敗北** | 失敗したランでも金貨と実績が残る。**どのランも無駄にならない**                          |
| **フロー状態**       | 圧倒できる時間と緊張が高まる時間を交互に置き、挑戦と技能を釣り合わせる                  |
| **自律性と実験**     | 49 キャラクター、ビルドの作り直しが自由。試行の反復を促す                               |

さらに、**数秒に一度は何か良いことが起きる**密度で組まれている。
敵が経験値を落とし、レベルアップが選択肢を出し、宝箱が強化を吐く。

## 4. もう一つの土台 — 自己決定理論（SDT）

ドーパミンの話だけだと「どう中毒にさせるか」に寄ってしまう。
学術的にゲームの動機づけを説明する枠組みとしては、
**自己決定理論**とその適用である **PENS（Player Experience of Need Satisfaction）** が主流。

Ryan・Rigby・Przybylski（2006）の主張:

> ゲームが動機づけとして働くのは、プレイヤーが
> **自律性（autonomy）・有能感（competence）・関係性（relatedness）**
> を経験する度合いによる。

研究で示されたこと:

- ゲームの選好も、内発的動機づけの行動的・心理的指標も、
  プレイ中の基本的心理欲求の充足によって予測された
- **自律性と有能感の経験**が、楽しさ・継続意欲・自尊感情と気分の変化に結びついた
- 3 つの欲求はそれぞれ独立に、楽しさと将来のプレイを予測した
- 欲求が支えられたとき、プレイヤーは活力・自尊感情・肯定的気分も高かった

### 変動報酬と SDT の違い

- **変動報酬**は「やめられなさ」を作る。短期的に強力だが、満足を生むとは限らない
- **SDT** は「満足」を作る。長期的な愛着とよい評判につながる

両方を回せるのが理想だが、**どちらを軸にするかは設計者の選択**になる。

## 5. 倫理的な線引き

調べた記事は、これらの仕組みを中立〜肯定的に扱っており、
依存や操作の懸念には触れていなかった。ここは自分で線を引く必要がある。

線を引く目安として使えそうな区別:

| 許容しやすい                       | 慎重にすべき                             |
| ---------------------------------- | ---------------------------------------- |
| 結果の不確実性（どの変異が出るか） | **課金と結びついた**不確実性             |
| 失敗しても進捗が残る               | 進捗を人質に取る復帰圧力                 |
| 惜しい負けが自然に生じる           | 意図的に「あと一歩」を演出して失敗させる |
| セッションが自然に終わる           | 終わりどころを作らない                   |
| プレイヤーが上達を実感する         | 上達なしに数字だけが増える               |

**「1 ラン 3〜8 分で必ず終わる」という設計は、
それ自体が倫理的な安全装置**として働いている。

---

## この企画への当てはめ

### すでに機能しているもの

- **変動報酬**: 突然変異のドラフトが独立ロールで、複合サメの出現は確率の積。
  レアリティが累計生産数に連動するため、予測が学習されてから外れる構造になっている
- **勝利に見える敗北**: 深度を突破できなくても、削ったぶんは総戦果に入り研究予算になる。
  Vampire Survivors と同じく「どのランも無駄にならない」
- **ニアミス**: 予備電源（時間切れの瞬間に +20 秒）は、
  ニアミスを**救済する**方向の仕掛け。惜しさを増幅するのではなく解消する側に置いている
- **自律性**: ドラフトの選択（重ね取り / 分散）とスキルツリーの振り分け
- **有能感**: 到達深度という明確な指標があり、周回ごとに伸びる

### 弱いところ

- **報酬の密度**。Vampire Survivors は「数秒に一度は何か良いことが起きる」。
  本作の培養フェーズ 60 秒は、
  クリックと施設購入以外に**良いことが起きない時間**がある。
  観測記録の追加で多少埋まったが、まだ密度が低い
- **関係性（relatedness）**が完全に欠けている。
  SDT の 3 要素のうち 1 つが 0。ソロゲームでは埋めにくいが、
  スコア共有や「他のプレイヤーが作ったサメ」を見せる形なら余地はある
- **予測誤差の設計が暗黙的**。レアリティ制で自然に生まれてはいるが、
  「ここで期待を裏切る」と意図して置いた地点は**深度 11 の反転だけ**

### 検討に値するもの

1. **培養フェーズに小さな報酬を撒く。**
   一定数の生産ごとに短いログや小さな演出を出すだけでも密度が上がる。
   Vampire Survivors の「数秒に一度」に寄せる
2. **予測を作ってから外す地点をもう 1〜2 箇所置く。**
   深度 11 の反転は成功例。同じ構造を、
   たとえば「特定の複合サメが初めて生まれたときだけ特別な演出」で作れる
3. **関係性の代替**。
   マッドサイエンティストという設定上、
   「査読者」「学会」といった架空の他者を置くと世界観と両立する

### 意図的にやらないこと

- **課金と結びついた不確実性**。本作は課金がないので該当しないが、
  仮に入れるとしても不確実性とは結びつけない
- **復帰圧力**（放置ペナルティ、ログインボーナス）。
  「ランは必ず終わる」設計と矛盾する

---

## 出典

- [Dopamine, uncertainty and TD learning — PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC1171969/)
- [The Dopamine Prediction Error: Contributions to Associative Models of Reward Learning — PMC](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5319959/)
- [Dopamine Modulates Adaptive Prediction Error Coding in the Human Midbrain and Striatum — PMC](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5320604/)
- [Engineered highs: Reward variability and frequency as potential prerequisites of behavioural addiction — ScienceDirect](https://www.sciencedirect.com/science/article/pii/S0306460323000217)
- [How a token-based game may elicit the reward prediction error — Frontiers in Psychology](https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2023.1077406/full)
- [Vampire Survivors: how developers used gambling psychology to create a Bafta-winning game — The Conversation](https://theconversation.com/vampire-survivors-how-developers-used-gambling-psychology-to-create-a-bafta-winning-game-203613)
- [Player Experience of Needs Satisfaction (PENS) — selfdeterminationtheory.org](https://selfdeterminationtheory.org/player-experience-of-needs-satisfaction-pens/)
- [The Motivational Pull of Video Games: A Self-Determination Theory Approach — Ryan, Rigby & Przybylski (2006)](https://selfdeterminationtheory.org/SDT/documents/2006_RyanRigbyPrzybylski_MandE.pdf)
- [A Motivational Model of Video Game Engagement — Przybylski, Rigby & Ryan](https://selfdeterminationtheory.org/SDT/documents/2010_PrzybylskiRigbyRyan_ROGP.pdf)
- [The Psychology of Vampire Survivors — Psychology and Video Games](https://platinumparagon.info/psychology-of-vampire-survivors/)
