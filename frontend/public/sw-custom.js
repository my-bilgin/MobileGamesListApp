self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Yalnızca POST ve /share-target ise işleme al
  if (event.request.method === 'POST' && url.pathname === '/share-target') {
    event.respondWith(handleShareTarget(event));
  }
});

async function handleShareTarget(event) {
  const formData = await event.request.formData();
  // manifest'te "url" paramı varsa:
  const sharedUrl = formData.get('url') || formData.get('shared_url') || '';

  // Veriyi cache içine yaz (basit yöntem)
  const cache = await caches.open('shared-data');
  await cache.put('/last-shared-url', new Response(sharedUrl));

  // Başka sayfaya yönlendir
  return Response.redirect('/share-target-view', 303);
} 