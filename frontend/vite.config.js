import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['logoidea4.png', 'pwa-192x192.jpg', 'pwa-512x512.jpg'],
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
        name: 'Luren by Elarion',
        short_name: 'Luren',
        description: 'Your personal alignment journal — track habits, moods, and daily actions.',
        theme_color: '#06131f',
        background_color: '#06131f',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.jpg',
            sizes: '192x192',
            type: 'image/jpeg',
            purpose: 'any',
          },
          {
            src: 'pwa-512x512.jpg',
            sizes: '512x512',
            type: 'image/jpeg',
            purpose: 'any',
          },
          // TODO: add pwa-512x512-maskable.png (PNG, purpose: maskable) for Play Store adaptive icons
        ],
        shortcuts: [
          {
            name: 'Actions',
            short_name: 'Actions',
            url: '/tasks',
            icons: [{ src: 'pwa-192x192.jpg', sizes: '192x192', type: 'image/jpeg' }],
          },
          {
            name: 'Reflect',
            short_name: 'Reflect',
            url: '/reflect',
            icons: [{ src: 'pwa-192x192.jpg', sizes: '192x192', type: 'image/jpeg' }],
          },
        ],
      },
    }),
  ],
})
