self.__WB_MANIFEST;

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Yalnızca POST ve /share-target ise işleme al
  if (event.request.method === 'POST' && url.pathname === '/share-target') {
    event.respondWith(handleShareTarget(event));
  }
});

async function handleShareTarget(event) {
  try {
    const formData = await event.request.formData();
    console.log('Service Worker: Form data alındı');
    
    // manifest'te "url" paramı varsa:
    const sharedUrl = formData.get('url') || formData.get('shared_url') || '';
    console.log('Service Worker: Shared URL:', sharedUrl);

    if (sharedUrl) {
      // localStorage'a yaz (daha güvenilir)
      try {
        // Service Worker'dan localStorage'a erişim için postMessage kullan
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
          client.postMessage({
            type: 'SHARED_URL',
            url: sharedUrl
          });
        });
        console.log('Service Worker: URL postMessage ile gönderildi');
      } catch (error) {
        console.log('Service Worker: postMessage hatası:', error);
      }
      
      // Cache'e de yaz (backup)
      const cache = await caches.open('shared-data');
      const response = new Response(sharedUrl, {
        headers: { 'Content-Type': 'text/plain' }
      });
      await cache.put('/last-shared-url', response);
      console.log('Service Worker: URL cache\'e yazıldı');
    }

    // Başka sayfaya yönlendir
    return Response.redirect('/share-target-view', 303);
  } catch (error) {
    console.error('Service Worker: Hata:', error);
    // Hata durumunda da yönlendir
    return Response.redirect('/share-target-view', 303);
  }
} 