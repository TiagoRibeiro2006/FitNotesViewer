import { createHash } from 'node:crypto'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

function offlineServiceWorker() {
  return {
    name: 'fitnotes-offline-service-worker',
    generateBundle(_options, bundle) {
      const files = Object.entries(bundle)
        .filter(([fileName]) => fileName !== 'sw.js')
        .map(([fileName]) => `/${fileName}`)

      const publicFiles = [
        '/',
        '/index.html',
        '/manifest.webmanifest',
        '/favicon.svg',
        '/icons/icon-192.png',
        '/icons/icon-512.png',
        '/icons/icon-maskable-512.png',
        '/icons/apple-touch-icon.png',
      ]

      const precache = [...new Set([...publicFiles, ...files])].sort()
      const fingerprint = createHash('sha256')

      for (const [fileName, output] of Object.entries(bundle).sort(([a], [b]) => a.localeCompare(b))) {
        fingerprint.update(fileName)
        fingerprint.update(output.type === 'chunk' ? output.code : String(output.source ?? ''))
      }

      const version = `${Date.now().toString(36)}-${fingerprint.digest('hex').slice(0, 12)}`
      const source = buildServiceWorker(precache, version)

      this.emitFile({
        type: 'asset',
        fileName: 'sw.js',
        source,
      })
    },
  }
}

function buildServiceWorker(precache, version) {
  return `const CACHE_PREFIX = 'fitnotes-viewer-'
const CACHE_NAME = CACHE_PREFIX + '${version}'
const PRECACHE = ${JSON.stringify(precache, null, 2)}

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME)
      await Promise.all(
        PRECACHE.map(async (url) => {
          const response = await fetch(new Request(url, { cache: 'reload' }))
          if (!response.ok) throw new Error('Could not precache ' + url)
          await cache.put(url, response)
        }),
      )
      await self.skipWaiting()
    })(),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(
        keys
          .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
          .map((key) => caches.delete(key)),
      )
      await self.clients.claim()
    })(),
  )
})

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting()
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    event.respondWith(networkFirstNavigation(request))
    return
  }

  event.respondWith(cacheFirst(request))
})

async function networkFirstNavigation(request) {
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME)
      await cache.put('/index.html', response.clone())
      await cache.put('/', response.clone())
    }
    return response
  } catch {
    return (await caches.match(request)) || (await caches.match('/index.html')) || (await caches.match('/'))
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request)
  if (cached) return cached

  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME)
      await cache.put(request, response.clone())
    }
    return response
  } catch {
    return Response.error()
  }
}
`
}

export default defineConfig({
  plugins: [vue(), offlineServiceWorker()],
  build: {
    target: 'es2020',
  },
})
