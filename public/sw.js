self.addEventListener("install", () => self.skipWaiting())
self.addEventListener("activate", e => e.waitUntil(clients.claim()))

self.addEventListener("push", e => {
  if (!e.data) return
  let payload
  try { payload = e.data.json() }
  catch { payload = { title: "Dumxi", body: e.data.text(), url: "/" } }

  e.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: payload.icon || "/icon-192.png",
      tag: payload.tag || "dumxi",
      data: { url: payload.url || "/" },
      vibrate: [200, 100, 200],
    })
  )
})

self.addEventListener("notificationclick", e => {
  e.notification.close()
  const url = e.notification.data?.url || "/"
  e.waitUntil(
    clients.matchAll({ type: "window" }).then(windowClients => {
      const existing = windowClients.find(c => c.url.includes("dumxi.com"))
      if (existing) { existing.focus(); return existing.navigate(url) }
      return clients.openWindow("https://dumxi.com" + url)
    })
  )
})
