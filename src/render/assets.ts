/**
 * スプライト画像の差し替え。
 *
 * public/sprites/ に決められた名前で PNG を置くと、
 * 手続きで描いている仮の絵を自動的に上書きする。**コードの変更は不要**。
 *
 * ファイルが無ければ 404 になり、これまで通り手続き描画にフォールバックする。
 * 読み込みが完了した時点で合成キャッシュを捨てるので、
 * 開発中にファイルを足せばリロードだけで反映される。
 *
 * 画像はすべて 64×40 の透過 PNG。
 * 部位の位置合わせは画像の中で済ませる（アンカー指定は不要）。
 */

/*
 * Vite の base を前置きする。カスタムドメインの直下に置くなら '/sprites' だが、
 * ユーザーページのサブパス（例 /inkurimentaru/）に置いたときに 404 になるため、
 * ビルド時の base をそのまま使う。
 */
const BASE_PATH = `${import.meta.env.BASE_URL}sprites`.replace('//', '/')

/** 読み込み済み（null は「無い」と確定したもの） */
const loaded = new Map<string, HTMLImageElement | null>()
const listeners = new Set<() => void>()

export function onAssetLoaded(fn: () => void): () => void {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

/**
 * 画像を取得する。まだ読み込んでいなければ非同期で取りにいき、
 * その回は null（＝手続き描画）を返す。
 */
export function asset(key: string): HTMLImageElement | null {
  const hit = loaded.get(key)
  if (hit !== undefined) return hit

  loaded.set(key, null)
  const img = new Image()
  img.onload = () => {
    loaded.set(key, img)
    for (const fn of listeners) fn()
  }
  img.onerror = () => {
    // 用意されていないだけなので、手続き描画のまま進む
    loaded.set(key, null)
  }
  img.src = `${BASE_PATH}/${key}.png`
  return null
}

/** 画像があればそれを描き、無ければ手続き描画にフォールバックする */
export function drawLayer(
  ctx: CanvasRenderingContext2D,
  key: string,
  fallback: (ctx: CanvasRenderingContext2D) => void,
): void {
  const img = asset(key)
  if (img) ctx.drawImage(img, 0, 0)
  else fallback(ctx)
}
