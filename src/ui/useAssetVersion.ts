import { useEffect, useState } from 'react'
import { onAssetLoaded } from '../render/assets.ts'

/**
 * 差し替え用の画像が読み込まれた回数。
 * これを依存に入れておくと、PNG を置いたときに描き直される。
 */
export function useAssetVersion(): number {
  const [v, setV] = useState(0)
  useEffect(() => onAssetLoaded(() => setV((x) => x + 1)), [])
  return v
}
