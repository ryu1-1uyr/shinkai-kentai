/**
 * 絵が入る箇所はすべてこのコンポーネントを通す。
 *
 * DOM には `data-sprite="building:tank"` のように安定した ID が刻まれるので、
 * 後からグラフィックを当てるときは CSS 側でこのセレクタに background-image を
 * 指定し、.sprite-glyph を display:none にするだけでよい。
 * コンポーネントのコードを触る必要はない。
 */
export type SpriteKind = 'building' | 'mutation' | 'resource' | 'target' | 'ui'

const GLYPHS: Record<string, string> = {
  'building:tank': '🧪',
  'building:feeder': '🥩',
  'building:breeder': '🧬',
  'building:accelerator': '⚡',
  'building:launcher': '🚀',

  'mutation:glow': '✨',
  'mutation:frenzy': '🩸',
  'mutation:twinHead': '🦈',
  'mutation:swarm': '🐟',
  'mutation:giant': '🐋',
  'mutation:ancient': '🦕',
  'mutation:pressure': '🌊',
  'mutation:abyss': '🌑',
  'mutation:tentacle': '🐙',
  'mutation:eldritch': '👁',
  'mutation:armor': '🛡',
  'mutation:mecha': '🤖',
  'mutation:volt': '⚡',
  'mutation:autonomous': '🔫',
  'mutation:zeroG': '🌀',
  'mutation:meteor': '☄️',
  'mutation:cosmic': '🌌',
  'mutation:alien': '👽',

  'resource:culture': '🧪',
  'resource:shark': '🦈',
  'resource:score': '💥',

  'target:normal': '🏢',
  'target:boss': '🏛',

  'ui:beam': '🛰',
}

export function Sprite({ kind, id }: { kind: SpriteKind; id: string }) {
  const key = `${kind}:${id}`
  return (
    <span className="sprite" data-sprite={key} aria-hidden="true">
      <span className="sprite-glyph">{GLYPHS[key] ?? '◻'}</span>
    </span>
  )
}
