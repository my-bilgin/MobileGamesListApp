console.log('[SW] Service worker yüklendi...');


self.__WB_MANIFEST;
self.addEventListener('fetch', (event) => {
  console.log('[SW] fetch event:', event.request.method, event.request.url);

  const url = new URL(event.request.url);

  if (event.request.method === 'POST' && url.pathname === '/share-target') {
    console.log('[SW] POST /share-target isteği yakalandı 🎯');
    event.respondWith(handleShareTarget(event));
  }
});


async function handleShareTarget(event) {
  const formData = await event.request.formData();
  const sharedUrl = formData.get('url') || formData.get('shared_url') || '';
  console.log('[SW] Paylaşılan URL:', sharedUrl);

  const cache = await caches.open('shared-data');
  await cache.put('/last-shared-url', new Response(sharedUrl));
  console.log('[SW] URL cache\'e yazıldı.');

  return Response.redirect('/share-target-view', 303);
}
