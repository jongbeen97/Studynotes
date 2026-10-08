import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// PWA 설정: 휴대폰·태블릿·맥에서 "홈 화면에 추가"로 앱처럼 설치할 수 있게 해 준다.
export default defineConfig({
  build: {
    // Firebase·React를 따로 묶어 두면 앱 코드만 바뀔 때 큰 파일을 다시 받지 않아도 된다.
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
        },
      },
    },
    chunkSizeWarningLimit: 700,
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate', // 새 버전을 배포하면 다음 실행 때 자동으로 바뀐다
      injectRegister: 'auto',
      includeAssets: ['icons/favicon.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        name: '개발일지',
        short_name: '개발일지',
        description: '하루 한 장 개발 기록, 일정 달력, D+1·D+7 복습, 개념 지도 채우기',
        lang: 'ko',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#EDF0F2',
        theme_color: '#2944C8',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Firebase 로그인 화면(/__/auth/...)은 서비스 워커가 가로채면 안 된다.
        navigateFallbackDenylist: [/^\/__\//],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
});
