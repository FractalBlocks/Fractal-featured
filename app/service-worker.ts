import { lang } from './Root/i18n'
import * as bundles from './bundles.json'

declare const self: any

var CACHE = 'V1'

self.addEventListener('install', (evt: any) => {
  evt.waitUntil(precache())
})

self.addEventListener('activate', (evt: any) => {
  evt.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.filter(name => name !== CACHE).map((name) => {
          return caches.delete(name)
        })
      )
    })
  )
})

self.addEventListener('fetch', (evt: any) => {
  evt.respondWith(fromCache(evt.request))
})

function precache() {
  return caches.open(CACHE).then(cache => {
    return cache.addAll([
      ...process.env.isProduction === 'true' ? [`langs/${lang}.js`] : [], // caches default lang
      ...<string[]> bundles,
    ])
  }).then(() => self.skipWaiting())
}

function fromCache(request) {
  return caches.open(CACHE).then((cache) => {
    return cache.match(request).then(<any> ((response) => {
      return response || fetch(request).then(function(response) {
        console.log(request.status)
        cache.put(request, response.clone())
        return response
      })
    }))
  })
}
