import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'injectManifest',
      srcDir: 'public',
      filename: 'sw-custom.js',
      injectManifest: {
        swSrc: 'public/sw-custom.js',
        swDest: 'sw-custom.js',
      },
      manifest: {
        name: 'Oyun Listem',
        short_name: 'OyunListem',
        start_url: '/',
        display: 'standalone',
        background_color: '#121212',
        theme_color: '#1976d2',
        lang: 'tr',
        scope: '/',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' }
        ],
        share_target: {
          action: '/share-target',
          method: 'POST',
          enctype: 'application/x-www-form-urlencoded',
          params: {
            title: 'title',
            text: 'text',
            url: 'url'
          }
        }
      }
    })
  ]
})
