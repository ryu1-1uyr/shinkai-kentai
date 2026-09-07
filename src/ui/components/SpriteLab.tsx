import { useEffect, useRef } from 'react'
import { maskOf, MUTATIONS, nameOfMask } from '../../game/mutations.ts'
import { sharkSprite } from '../../render/sharkSprite.ts'
import { useAssetVersion } from '../useAssetVersion.ts'

/** 合成スプライトの確認用。開発時のみ使う */
function Cell({ mask, label, scale = 2 }: { mask: number; label: string; scale?: number }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const assetVersion = useAssetVersion()
  useEffect(() => {
    const c = ref.current
    if (!c) return
    const sprite = sharkSprite(mask, 1)
    c.width = sprite.width * scale
    c.height = sprite.height * scale
    const g = c.getContext('2d')!
    g.imageSmoothingEnabled = false
    g.clearRect(0, 0, c.width, c.height)
    g.drawImage(sprite, 0, 0, c.width, c.height)
  }, [mask, scale, assetVersion])
  return (
    <div className="slab-cell">
      <canvas ref={ref} />
      <span>{label}</span>
    </div>
  )
}

const bit = (id: string) => maskOf(MUTATIONS.find((m) => m.id === id)!)

const COMBOS: Array<[number, string]> = [
  [bit('ghost') | 0, 'ゴースト単体（半透明）'],
  [bit('fungus') + bit('ghost') + bit('zombie'), 'キノコゴーストゾンビ'],
  [bit('albino') + bit('swift') + bit('spike'), 'スイフトアルビノスパイク'],
  [bit('tripleHead') + bit('giant') + bit('poison'), 'ポイズントリプルヘッド巨大'],
  [bit('tornado') + bit('zeroG') + bit('tsunami'), 'フライングトルネードツナミ'],
  [bit('magma') + bit('frozen') + bit('storm'), 'マグマフローズンストーム'],
  [bit('frenzy') + bit('pressure') + bit('abyss') + bit('tentacle'), '狂乱深圧アビスタコ'],
  [bit('giant') + bit('armor') + bit('mecha') + bit('volt'), '巨大アーマードメカサンダー'],
  [bit('triple') + bit('zombie') + bit('magma'), 'トリプルゾンビマグマ'],
  [bit('ancient') + bit('eldritch') + bit('tsunami'), 'エンシェント邪神ツナミ'],
  [MUTATIONS.reduce((a, m) => a + maskOf(m), 0), '全部乗せ（32種）'],
]

export function SpriteLab({ onClose }: { onClose: () => void }) {
  return (
    <div className="overlay">
      <div className="modal slab">
        <div className="slab-head">
          <div className="modal-title">スプライト合成の確認</div>
          <button className="btn" onClick={onClose}>
            閉じる
          </button>
        </div>

        <div className="panel-title">単体</div>
        <div className="slab-grid">
          <Cell mask={0} label="通常サメ" />
          {MUTATIONS.map((m) => (
            <Cell key={m.id} mask={maskOf(m)} label={m.name} />
          ))}
        </div>

        <div className="panel-title">組み合わせ</div>
        <div className="slab-grid">
          {COMBOS.map(([mask, label]) => (
            <Cell key={label} mask={mask} label={label} scale={2} />
          ))}
        </div>

        <div className="panel-title">自動生成された名前の確認</div>
        <div className="empty-note">
          {COMBOS.slice(0, 4).map(([mask]) => nameOfMask(mask)).join(' / ')}
        </div>
      </div>
    </div>
  )
}
