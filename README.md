# 深海検体増殖計画（仮題）

ブラウザで動くローグライト × インクリメンタルゲーム。

深海の秘密研究施設でサメを培養し、突然変異させて地上の都市にぶつける。
1 ラン 3〜8 分。到達深度に応じた研究予算で恒久強化を買い、次のランへ。
ランは必ず終わる。生産基地が逆探知され、衛星ビームで消し飛ばされる。

## 動かす

```bash
npm install
npm run dev        # http://localhost:5173
```

Node は Volta で 24.20.0 に固定してある（`package.json` の `volta` フィールド）。
24 系は `.ts` を型ストリップで直接実行できるため、シミュレータを走らせるのに
追加のランタイムが要らない。

| コマンド            | 内容                                                                       |
| ------------------- | -------------------------------------------------------------------------- |
| `npm run dev`       | 開発サーバ                                                                 |
| `npm run build`     | 型チェック + 本番ビルド                                                    |
| `npm run typecheck` | 型チェックのみ                                                             |
| `npm run sim`       | バランスのシミュレーション（ドラフト方針 / タイマー方式 / 購入比率の比較） |
| `npm run format`    | Prettier で整形                                                            |

### バランスを数字で確かめる

1 ラン数分のゲームを手で確認していると調整が終わらないため、
画面なしで数千回まわせるシミュレータを用意してある。

```bash
node src/sim/run.ts trace      # 10 秒ごとの状態遷移をトレース
node src/sim/analyze.ts        # 係数の掃引とメタ進行の伸びしろ
node src/sim/progress.ts 40    # 恒久強化を積みながら 40 ラン連続プレイ
node src/sim/luck.ts           # 運がランに与える影響
node src/sim/rarity.ts         # レア度ごとのドラフト出現率
node src/sim/species.ts        # 生成された複合サメの一覧
```

## デプロイ

`main` に push すると GitHub Actions がビルドして GitHub Pages に配信する
（[.github/workflows/deploy.yml](.github/workflows/deploy.yml)）。
公開先は <https://shark.ryu-reu.me>。

配信先を変えるときに触るのは 3 箇所。

| 場所                          | 何を持っているか                                                     |
| ----------------------------- | -------------------------------------------------------------------- |
| `public/CNAME`                | 独自ドメイン。ビルド成果物にそのまま入る                             |
| `vite.config.ts` の `base`    | 配信するパス。独自ドメインの直下なら `/`                             |
| リポジトリの Settings → Pages | Source を GitHub Actions にする。Custom domain は CNAME から拾われる |

サブパス（`ryu1-1uyr.github.io/<repo>/`）へ置く場合は `base` を `/<repo>/` にする。
スプライトの読み込みは `import.meta.env.BASE_URL` を前置きしているので、
`base` を変えれば追従する。

### DNS

`ryu-reu.me` の DNS に CNAME レコードを 1 本足す。

```
shark   CNAME   ryu1-1uyr.github.io.
```

反映されると Pages 側で証明書が発行され、Settings → Pages の
**Enforce HTTPS** が有効にできるようになる。

## ドキュメント

| ファイル                                             | 内容                                                         |
| ---------------------------------------------------- | ------------------------------------------------------------ |
| [SPEC.md](SPEC.md)                                   | 仕様。決定事項だけでなく**判断の根拠と実測ログ**も残してある |
| [TASKS.md](TASKS.md)                                 | 残タスク                                                     |
| [public/sprites/README.md](public/sprites/README.md) | **グラフィックの追加手順**                                   |

## グラフィックを追加する

いまのドット絵はコードで手続き的に生成した仮のもの。
**`public/sprites/` に決められた名前で PNG を置くと自動的に上書きされる。**
コードの変更は要らない。

```
64 × 40 ピクセルの透過 PNG を public/sprites/ 以下に置く
  ↓
リロードすると差し替わる
```

ファイルが無いレイヤーは仮の絵のまま描かれるので、**1 枚ずつ置き換えていける**。
必要なのは全部で 24 枚。ファイル名と各画像に描くものは
[public/sprites/README.md](public/sprites/README.md) にまとめてある。

## 構成

```
src/
  game/     React にも DOM にも依存しない純粋なゲームロジック
            config.ts に可変パラメータを集約し、シミュレータから掃引できる
  sim/      ヘッドレスのバランスシミュレータ
  render/   スプライトの合成。変異を積み上げて 1 枚に焼き、mask 単位でキャッシュする
  store/    ゲームループと React の橋渡し（外部ストア + useSyncExternalStore）
  ui/       画面。色・余白は tokens.css の CSS 変数に集約し、TSX には書かない
  meta/     セーブデータ（localStorage）
public/
  sprites/  差し替え用の画像置き場
```

`game/` を React から完全に切り離してあるのは、バランス調整をテストで回すため。
UI を全面的に作り直しても、`store/gameStore.ts` の口が同じならゲームロジックには手が入らない。
