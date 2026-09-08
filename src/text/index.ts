import { ja } from './ja.ts'

/**
 * 表示テキストの入り口。
 *
 * いまは日本語しか無いのでそのまま返す。ロケールを増やすときは
 * `en.ts` を `satisfies Text` で書き、ここで選ぶ。
 * 型が同じ形を要求するので、キーの抜けや余りはコンパイルで落ちる。
 */
export type Text = typeof ja

export const t: Text = ja

/**
 * `{name}` の差し込み。
 *
 * 数式は呼び出し側（config やアップグレードの定義）に残し、
 * 辞書には文言だけを置く。整形済みの文字列や数値を渡す。
 */
export function fill(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (whole, key: string) => (key in vars ? String(vars[key]) : whole))
}
