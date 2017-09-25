import * as bundles from './bundles.json'

var CACHE = 'V5'

self.addEventListener('install', (evt: any) => {
  console.log('The service worker is being installed.')
  evt.waitUntil(precache())
})

self.addEventListener('fetch', (evt: any) => {
  console.log('The service worker is serving the asset.')
  evt.respondWith(fromCache(evt.request))
  evt.waitUntil(update(evt.request))
})

function precache() {
  return caches.open(CACHE).then(cache => {
    return cache.addAll(<string[]> bundles)
  })
}

function fromCache(request) {
  return caches.open(CACHE).then(function (cache) {
    return cache.match(request).then(<any> ((matching) => {
      return matching || Promise.reject('no-match')
    }))
  })
}

function update(request) {
  return caches.open(CACHE).then(function (cache) {
    return fetch(request).then(function (response) {
      return cache.put(request, response)
    })
  })
}
