// Loaded by the generated service worker: a click on a Révise notification opens the right page.
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const route = (event.notification.data && event.notification.data.route) || '/'
  event.waitUntil((async () => {
    const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    const base = self.registration.scope
    for (const w of wins) {
      if (w.url.startsWith(base)) { await w.focus(); w.navigate ? await w.navigate(base + '#' + route) : null; return }
    }
    await self.clients.openWindow(base + '#' + route)
  })())
})
