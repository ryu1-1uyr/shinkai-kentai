import { useSyncExternalStore } from 'react'
import { getState, getVersion, subscribe } from '../store/gameStore.ts'

/**
 * ゲーム状態は React の外にあるミュータブルなオブジェクト。
 * バージョン番号を snapshot にして、変化したときだけ再レンダさせる。
 */
export function useGame() {
  useSyncExternalStore(subscribe, getVersion, getVersion)
  return getState()
}
