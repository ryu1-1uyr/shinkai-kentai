# ゲームの UI / UX

Web の UI 設計とゲームの UI 設計は、共通する部分と決定的に違う部分がある。
違う部分が「没入」と「一瞬で読めること」の 2 点。

## 1. UI の分類 — diegetic / non-diegetic / spatial / meta

いま業界で使われているこの 4 分類は、
**Erik Fagerholt と Magnus Lorentzon の修士論文（Chalmers 工科大学, 2009）
"Beyond the HUD — User Interfaces for Increased Player Immersion in FPS Games"**
が出どころ。

| 分類 | ゲーム世界の中に存在するか | キャラクターに見えているか | 例 |
|---|---|---|---|
| **diegetic** | ある | 見えている | Dead Space のスーツに埋め込まれた体力表示 / Far Cry 2 で実際に紙の地図を読む |
| **non-diegetic** | ない | 見えていない | 通常の HUD、画面隅の体力バー |
| **spatial** | ある（3D 空間に置かれる） | 見えていない | 敵の頭上のマーカー |
| **meta** | ない | 見えている | 画面端の血しぶき（被弾表現） |

**diegetic UI は没入を高めるが、可読性を犠牲にしやすい。**
全部を diegetic にするのが良いわけではなく、
情報の重要度に応じて使い分けるのが定石になっている。

## 2. HUD の原則

調べた範囲で繰り返し出てきたもの。

- **一目で読めることが第一。**
  これは Nielsen Norman Group の 10 のユーザビリティヒューリスティクスの第 1 条
  「システム状態の可視性」そのもの
- **情報の最小主義。**
  必要な瞬間に必要なものだけを出し、不要になったら
  優雅に消えるか隠れる
- **優先度で並べる。** 全部を同じ重みで置かない
- **強いコントラスト。** 動きのある背景の上でも読めること
- **色覚異常への対応**を含むアクセシビリティ設定
- **端末とプレイヤー層をまたいだプレイテスト**

そして全体として、
**ゲーム UI は情報の伝達と没入の維持を両立させる必要があり、
しばしば「見えない設計」が求められる** ——
体験を邪魔せずに支える、という言い方がされていた。

## 3. オンボーディングと初回体験（FTUE）

ここは Web のオンボーディングと考え方が近いが、数字がシビア。

### D1 が全ての上限になる

> Day 1 リテンションは初回体験（FTUE）の強さを測る指標であり、
> **下流の全指標の上限を決める**。
> Day 1 で 80% が消えるなら、Day 7 が 20% を超えることは数学的にありえない。

- 勝負は**最初の 60 秒**でつく
- 離脱の大半は初日中に起きる

### 効くとされている手法

- **オプトイン型の説明。**
  プレイヤー側から情報を求めたときに出す説明のほうが、
  規則的で予測可能な説明の連続より**記憶に残る**
- **初回セッション内に、意味のある報酬を伴う早い達成と、
  目に見える進捗を置く。** これで D1 が 5〜10 ポイント上がる、とされている
- 個人開発者にとって「チュートリアルの設計は、
  おそらくゲーム開発で最も重要な部分」という主張もあった

---

## この企画への当てはめ

### UI 分類での自己診断

現状はほぼ全部が **non-diegetic**（画面に重ねた普通の UI）。

diegetic に寄せられそうな箇所:

| 現状 | diegetic 化の案 |
|---|---|
| 培養液の数値 | 培養槽のグラフィックの中の液面の高さ |
| 深度表示 | 研究施設の深度計そのものを描く。**「深度計が壊れている」という設定と直結する** |
| 制限時間 | 逆探知の進捗ゲージ（追跡されている度合い） |
| 在庫 | 水槽の中を泳ぐサメの密度 |

特に**深度計**は、この作品の一番のネタが「計器の異常」である以上、
**計器そのものを diegetic に描く価値が高い**。
いまは `深度 1 沿岸の町` というテキストで、設定と表現が噛み合っていない。

ただし全部を diegetic にすると可読性が落ちる。
**深度計だけ diegetic、数値は non-diegetic** のような使い分けが現実的。

### HUD 原則との照合

| 原則 | 現状 |
|---|---|
| 一目で読める | タイマーは大きい。**及第点** |
| 情報の最小主義 | 常時表示のパネルが多く、**培養中に不要な情報が出ている** |
| 優先度で並べる | デザインレビューで指摘済み。主役パネルの強調は入れた |
| 強いコントラスト | 実測して AA に乗せた |
| アクセシビリティ | `prefers-reduced-motion` は対応済み。**aria-label が未対応** |
| プレイテスト | **未実施**。自分と AI しか触っていない |

### 初回体験の設計が完全に手つかず

これが**最大の穴**だと分かった。

現状の初回起動時に起きること:

1. 説明のないクリックボタンが 1 つある
2. 60 秒後に勝手に侵略が始まる
3. 何が起きているか分からないまま深度 1 で終わる

出典が言う「最初の 60 秒で勝負がつく」に照らすと、
**本作の最初の 60 秒はまるまる培養フェーズで、
何も起きないまま終わる**可能性がある。

対策として使えそうなもの:

- **オプトイン型の説明。**
  いま `交戦記録` パネルに常駐していた説明文を消して観測記録にしたが、
  代わりに「？」で開く説明を置く形なら記憶に残りやすい
- **初回セッション内の早い達成。**
  初回ランに限り、最初のドラフトを極端に早く出す
  （恒久強化「早期実験」の効果を、初回だけ無料で付与する）。
  「変異を選ぶ」という**このゲームの中核を 30 秒以内に体験させる**
- **目に見える進捗。**
  「次の実験機会」ゲージは入れた。これは方向として合っている

### 検討に値する優先順位

1. **初回ランだけドラフトを早く出す**（実装が軽く、効果が最も大きい）
2. **深度計を diegetic に描く**（世界観と直結する）
3. **オプトイン型の説明**（常駐説明文を畳む）
4. **aria-label**（既知の残タスク）

---

## 出典

- [Diegetic and Non-Diegetic UI in Games: Design Principles — Nasty Rodent](https://nastyrodent.com/diegetic-and-non-diegetic-ui/)
- [HUD in Video Games: Meaning, Examples & Design Guide — Sunstrike Studios](https://sunstrikestudios.com/en/blog/HUD_design_in_games/)
- [Usability heuristics and competition in games — UX Collective](https://uxdesign.cc/usability-heuristics-and-competition-in-games-707cac36ff12)
- [UX and UI in game design: exploring HUD, inventory, and menus — Bruna Delfino](https://medium.com/@brdelfino.work/ux-and-ui-in-game-design-exploring-hud-inventory-and-menus-5d8c189deb65)
- [Game UI/UX Design: Complete Guide — Generalist Programmer](https://generalistprogrammer.com/game-ui-ux-design)
- [Onboarding Decides Your D1: First-Session Design and the FTUE Metrics That Matter — Playio](https://blog.playio.co/mobile-game-onboarding-retention)
- [Tutorial UX: Your Indie Game's Onboarding Roadmap — Wayline](https://www.wayline.io/blog/tutorial-ux-indie-game-onboarding)
- [How Onboarding Should be Applied to Tutorials — Game Developer](https://www.gamedeveloper.com/design/how-onboarding-should-be-applied-to-tutorials)
- [Onboarding — Roblox Creator Hub](https://create.roblox.com/docs/production/game-design/onboarding)
