// Loaded by the generated service worker: Révise as a share target (see "share_target" in the manifest).
// What the phone shares is kept in a cache for the app, which then asks which subject it goes to.
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  if (event.request.method !== 'POST' || url.origin !== self.location.origin || !url.pathname.endsWith('/partager')) return
  event.respondWith((async () => {
    const back = new URL('./#/partage', self.registration.scope).href
    try {
      const form = await event.request.formData()
      const cache = await caches.open('revise-share')
      for (const key of await cache.keys()) await cache.delete(key)
      const files = form.getAll('files').filter((f) => typeof f === 'object' && f && 'size' in f)
      const list = []
      for (const [i, f] of files.entries()) {
        const key = `shared/${i}`
        await cache.put(key, new Response(f, { headers: { 'content-type': f.type || 'application/octet-stream' } }))
        list.push({ key, name: f.name || `partage-${i + 1}`, type: f.type || '', size: f.size })
      }
      const text = (name) => String(form.get(name) || '').slice(0, 20000)
      const meta = { at: Date.now(), title: text('title'), text: text('text'), url: text('url'), files: list }
      await cache.put('shared/meta', new Response(JSON.stringify(meta), { headers: { 'content-type': 'application/json' } }))
    } catch {
      // The page says nothing arrived; the student can share again.
    }
    return Response.redirect(back, 303)
  })())
})
