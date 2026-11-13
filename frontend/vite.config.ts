import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  // 與後端共用根目錄的 .env（只有 VITE_ 前綴會暴露給瀏覽器；API_PROXY_TARGET 只在 dev server 使用）
  const env = loadEnv(mode, '..', '')
  const apiTarget = env.API_PROXY_TARGET || 'http://localhost:8000'

  return {
    plugins: [react(), tailwindcss()],
    envDir: '..',
    server: {
      port: 5173,
      // 開發時 /api/* 轉發到 FastAPI，瀏覽器視為同源，不需要 CORS
      proxy: {
        '/api': { target: apiTarget, changeOrigin: true },
      },
    },
  }
})
