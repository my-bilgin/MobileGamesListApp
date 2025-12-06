// Service Worker for GameShare PWA
const CACHE_NAME = 'gameshare-v1';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/gameshare_logo.png'
];

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
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
    const formData = await event.request.formData();
    console.log('Service Worker: Form data alındı');
    console.log('Service Worker: Form data keys:', Array.from(formData.keys()));
    
    // manifest'te "url" paramı varsa:
    const sharedUrl = formData.get('url') || formData.get('shared_url') || formData.get('text') || '';
    console.log('Service Worker: Shared URL:', sharedUrl);
    
    // text alanından URL çıkarmayı dene (bazı tarayıcılar URL'yi text olarak gönderir)
    let finalUrl = sharedUrl;
    if (!finalUrl && formData.get('text')) {
      const text = formData.get('text');
      // URL pattern'ini ara
      const urlMatch = text.match(/https?:\/\/[^\s]+/);
      if (urlMatch) {
        finalUrl = urlMatch[0];
        console.log('Service Worker: Text\'ten URL çıkarıldı:', finalUrl);
      }
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
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
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