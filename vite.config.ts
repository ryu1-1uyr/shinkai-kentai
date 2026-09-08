import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  /*
   * 独自ドメインの直下に配信するので '/'。
   * ryu1-1uyr.github.io/<repo>/ のようなサブパスへ置くときは '/<repo>/' にする。
   */
  base: '/',
  plugins: [react()],
  server: { port: 5173 },
})
