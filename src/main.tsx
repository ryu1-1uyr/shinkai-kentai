import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './ui/App.tsx'
import './ui/styles/tokens.css'
import './ui/styles/layout.css'
import './ui/styles/components.css'
// モバイル（横画面）の調整。PC には一切影響しないよう全体をメディアクエリで囲ってある
import './ui/styles/mobile.css'
import { t } from './text/index.ts'

// タイトルも辞書から。index.html の <title> は初回描画までの控え
document.title = t.app.title

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
