import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['logoidea4.png'],
      manifest: {
        name: 'Elarion',
        short_name: 'Elarion',
        description: 'Track. Reflect. Evolve.',
        theme_color: '#06131f',
        background_color: '#06131f',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.jpg',
            sizes: '192x192',
            type: 'image/jpeg',
          },
          {
            src: 'pwa-512x512.jpg',
            sizes: '512x512',
            type: 'image/jpeg',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ],
})
