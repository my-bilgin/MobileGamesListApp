// Service Worker for GameShare PWA
// VERSION: 2.0 - Enhanced share target handling with detailed logging
const CACHE_NAME = 'gameshare-v2';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/gameshare_logo.png'
];

// Install event
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing - VERSION 2.0');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Opened cache:', CACHE_NAME);
        return cache.addAll(urlsToCache);
      })
  );
  // Yeni versiyonu hemen aktif et
  self.skipWaiting();
});

// Fetch event
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Share target için özel işleme
  // POST isteği ve /share-target path'i veya share-target içeren path
  if (event.request.method === 'POST' && (url.pathname === '/share-target' || url.pathname.includes('share-target'))) {
    console.log('Service Worker: Share target POST isteği yakalandı:', url.pathname);
    event.respondWith(handleShareTarget(event));
    return;
  }

  // Normal cache işleme
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});

// Share target handler
async function handleShareTarget(event) {
  try {
    console.log('Service Worker: handleShareTarget çağrıldı - VERSION 2.0');
    const formData = await event.request.formData();
    console.log('Service Worker: Form data alındı');
    
    // Tüm form data değerlerini logla
    const keys = Array.from(formData.keys());
    console.log('Service Worker: Form data keys:', keys);
    
    // Her key için değeri logla
    for (const key of keys) {
      const value = formData.get(key);
      console.log(`Service Worker: FormData["${key}"] =`, value, `(type: ${typeof value})`);
    }
    
    // manifest'te "url" paramı varsa:
    let sharedUrl = formData.get('url') || formData.get('shared_url') || '';
    console.log('Service Worker: Direct URL from formData.get("url"):', sharedUrl);
    
    // text alanından URL çıkarmayı dene (bazı tarayıcılar URL'yi text olarak gönderir)
    let finalUrl = sharedUrl;
    if (!finalUrl) {
      const text = formData.get('text') || '';
      const title = formData.get('title') || '';
      console.log('Service Worker: Text value:', text);
      console.log('Service Worker: Title value:', title);
      
      // Önce text'te URL ara
      if (text) {
        const urlMatch = text.match(/https?:\/\/[^\s\)]+/);
        if (urlMatch) {
          finalUrl = urlMatch[0];
          console.log('Service Worker: ✅ Text\'ten URL çıkarıldı:', finalUrl);
        } else {
          console.log('Service Worker: ❌ Text\'te URL bulunamadı');
        }
      }
      
      // Text'te bulunamazsa title'da ara
      if (!finalUrl && title) {
        const urlMatch = title.match(/https?:\/\/[^\s\)]+/);
        if (urlMatch) {
          finalUrl = urlMatch[0];
          console.log('Service Worker: ✅ Title\'den URL çıkarıldı:', finalUrl);
        } else {
          console.log('Service Worker: ❌ Title\'de URL bulunamadı');
        }
      }
      
      // Hala bulunamazsa, text ve title'ı birleştirip ara
      if (!finalUrl && (text || title)) {
        const combined = (text + ' ' + title).trim();
        const urlMatch = combined.match(/https?:\/\/[^\s\)]+/);
        if (urlMatch) {
          finalUrl = urlMatch[0];
          console.log('Service Worker: ✅ Combined text\'ten URL çıkarıldı:', finalUrl);
        } else {
          console.log('Service Worker: ❌ Combined text\'te URL bulunamadı');
        }
      }
    } else {
      finalUrl = sharedUrl;
      console.log('Service Worker: ✅ Direct URL kullanılıyor:', finalUrl);
    }

    if (finalUrl) {
      // Veriyi cache içine yaz
      const cache = await caches.open('shared-data');
      const response = new Response(finalUrl, {
        headers: { 'Content-Type': 'text/plain' }
      });
      await cache.put('/last-shared-url', response);
      console.log('Service Worker: URL cache\'e yazıldı:', finalUrl);
      
      // Client'a mesaj gönder (eğer client hazırsa)
      try {
        const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
        clients.forEach(client => {
          client.postMessage({
            type: 'SHARED_URL',
            url: finalUrl
          });
          console.log('Service Worker: Client\'a mesaj gönderildi:', finalUrl);
        });
      } catch (msgError) {
        console.warn('Service Worker: Client\'a mesaj gönderilemedi:', msgError);
      }
    } else {
      console.warn('Service Worker: URL bulunamadı! Form data:', {
        url: formData.get('url'),
        text: formData.get('text'),
        title: formData.get('title')
      });
    }

    // Başka sayfaya yönlendir
    return Response.redirect('/share-target-view', 303);
  } catch (error) {
    console.error('Service Worker: Hata:', error);
    // Hata durumunda da yönlendir
    return Response.redirect('/share-target-view', 303);
  }
}

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating - VERSION 2.0');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Tüm client'lara kontrolü al
      return self.clients.claim();
    })
  );
});

// Push notification event
self.addEventListener('push', (event) => {
  const options = {
    body: 'GameShare\'e hoş geldiniz!',
    icon: '/gameshare_logo.png',
    badge: '/gameshare_logo.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };

  event.waitUntil(
    self.registration.showNotification('GameShare', options)
  );
}); 