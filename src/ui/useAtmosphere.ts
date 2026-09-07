import { useEffect } from 'react'
import { airAt, isAscending, rgb, rgba } from '../render/atmosphere.ts'
import { getState } from '../store/gameStore.ts'
import { useGame } from './useGame.ts'

/**
 * 深度に応じた空気の色を CSS 変数として書き出す。
 * 色は body の背景レイヤーが読む。
 */
export function useAtmosphere(): void {
  const s = useGame()
  const depth = s.phase === 'culture' ? 0 : s.depth

  useEffect(() => {
    const air = airAt(depth)
    const root = document.documentElement
    root.style.setProperty('--air-top', rgb(air.top))
    root.style.setProperty('--air-bottom', rgb(air.bottom))
    root.style.setProperty('--air-accent', rgb(air.accent))
    root.style.setProperty('--air-glow', rgba(air.accent, 0.16))
    root.dataset.ascending = String(isAscending(depth))
  }, [depth])

  void getState
}
