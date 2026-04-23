import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['logoidea4.png', 'pwa-192x192.png', 'pwa-512x512.png', 'pwa-512x512-maskable.png'],
      workbox: {
        runtimeCaching: [
          {
            // Insight endpoints — NetworkFirst so stale data shows offline
            urlPattern: /\/api\/insights\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-insights',
              networkTimeoutSeconds: 6,
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // All other API routes — StaleWhileRevalidate
            urlPattern: /\/api\//,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'api-data',
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      manifest: {
        name: 'Elarion',
        short_name: 'Elarion',
        description: 'Your personal alignment journal — track habits, moods, and daily actions.',
        theme_color: '#06131f',
        background_color: '#06131f',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'pwa-512x512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
        shortcuts: [
          {
            name: 'Actions',
            short_name: 'Actions',
            url: '/tasks',
            icons: [{ src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' }],
          },
          {
            name: 'Reflect',
            short_name: 'Reflect',
            url: '/reflect',
            icons: [{ src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' }],
          },
        ],
      },
    }),
  ],
})
