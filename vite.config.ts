import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'favicon.ico', 'clmp-share-image.png', 'images/*.png'],
      manifest: {
        name: 'CLMP Tech - Construction Management',
        short_name: 'CLMP',
        description: 'Canadian construction management platform for contractors',
        theme_color: '#f97316',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'any',
        scope: '/',
        start_url: '/',
        id: 'clmp-tech-pwa',
        categories: ['productivity', 'business'],
        lang: 'en-CA',
        dir: 'ltr',
        icons: [
          {
            src: '/favicon.png',
            sizes: '48x48',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/favicon.png',
            sizes: '72x72',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/favicon.png',
            sizes: '96x96',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/favicon.png',
            sizes: '128x128',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/favicon.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/favicon.png',
            sizes: '384x384',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/favicon.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/favicon.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: '/favicon.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ],
        shortcuts: [
          {
            name: 'Dashboard',
            short_name: 'Dashboard',
            description: 'View project dashboard',
            url: '/dashboard',
            icons: [{ src: '/favicon.png', sizes: '96x96' }]
          },
          {
            name: 'Projects',
            short_name: 'Projects',
            description: 'Manage projects',
            url: '/projects',
            icons: [{ src: '/favicon.png', sizes: '96x96' }]
          },
          {
            name: 'Budget',
            short_name: 'Budget',
            description: 'Track finances',
            url: '/budget',
            icons: [{ src: '/favicon.png', sizes: '96x96' }]
          },
          {
            name: 'Chat',
            short_name: 'Chat',
            description: 'Team communication',
            url: '/chat',
            icons: [{ src: '/favicon.png', sizes: '96x96' }]
          }
        ],
        screenshots: [
          {
            src: '/clmp-share-image.png',
            sizes: '1280x720',
            type: 'image/png',
            form_factor: 'wide',
            label: 'Dashboard overview'
          }
        ],
        related_applications: [],
        prefer_related_applications: false
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024, // 8 MB limit
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/, /^\/supabase/],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/nkvhihqkfeqqkqhgthsv\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 // 1 hour
              },
              cacheableResponse: {
                statuses: [0, 200]
              },
              networkTimeoutSeconds: 10
            }
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          },
          {
            urlPattern: /\.(?:woff|woff2|ttf|otf)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'fonts-cache',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              }
            }
          }
        ],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true
      },
      devOptions: {
        enabled: false
      }
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
