self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (event.request.method === 'POST' && url.pathname === '/share-target') {
    console.log('SW: /share-target POST yakalandı!');
    event.respondWith(handleShareTarget(event));
  }
});

async function handleShareTarget(event) {
  const formData = await event.request.formData();
  console.log('SW: formData entries:', Array.from(formData.entries()));
  const sharedUrl = formData.get('url') || formData.get('shared_url') || '';

  const cache = await caches.open('shared-data');
  await cache.put('/last-shared-url', new Response(sharedUrl));
  console.log('SW: Cache yazıldı:', sharedUrl);

  return Response.redirect('/share-target-view', 303);
}

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  self.clients.claim();
}); 