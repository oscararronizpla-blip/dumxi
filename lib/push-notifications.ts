import webpush from "web-push"
import { adminDb } from "./firebase-admin"
import { COLLECTIONS } from "./constants"

webpush.setVapidDetails(
  "mailto:soporte@dumxi.com",
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export async function sendPushToUser(userId: string, payload: {
  title: string
  body: string
  icon?: string
  url?: string
  tag?: string
}) {
  const userDoc = await adminDb.collection(COLLECTIONS.users).doc(userId).get()
  const userData = userDoc.data()
  if (!userData?.pushSubscriptions?.length) return

  const message = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: payload.icon ?? "/icon-192.png",
    url: payload.url ?? "/dashboard",
    tag: payload.tag ?? "dumxi",
  })

  const results = await Promise.allSettled(
    userData.pushSubscriptions.map((sub: any) =>
      webpush.sendNotification({ endpoint: sub.endpoint, keys: sub.keys }, message)
    )
  )

  const valid = userData.pushSubscriptions.filter((_: any, i: number) => {
    const r = results[i]
    return r.status !== "rejected" || (r.reason as any)?.statusCode !== 410
  })

  if (valid.length !== userData.pushSubscriptions.length) {
    await adminDb.collection(COLLECTIONS.users).doc(userId).update({ pushSubscriptions: valid })
  }
}

export async function sendPushToUsers(userIds: string[], payload: Parameters<typeof sendPushToUser>[1]) {
  await Promise.allSettled(userIds.map(uid => sendPushToUser(uid, payload)))
}

export function notifyNewEnrollment(sessionDate: string, sessionTime: string, enrolled: number, remaining: number, sessionId: string) {
  return {
    title: "¡Nuevo alumno en tu clase! 🎉",
    body: `Clase del ${sessionDate} a las ${sessionTime} — ${enrolled}/5 alumnos. Faltan ${remaining} plazas.`,
    url: `/agenda?session=${sessionId}`,
    tag: `session-${sessionId}`,
  }
}

export function notifySessionConfirmed(sessionDate: string, sessionTime: string, sessionId: string) {
  return {
    title: "¡Clase confirmada! ✅",
    body: `La clase del ${sessionDate} a las ${sessionTime} está completa. Recibirás el link de Zoom 24h antes.`,
    url: `/dashboard?session=${sessionId}`,
    tag: `session-${sessionId}`,
  }
}

export function notifyLastSpot(sessionDate: string, sessionTime: string, sessionId: string) {
  return {
    title: "⚡ ¡Queda 1 plaza libre!",
    body: `La clase del ${sessionDate} a las ${sessionTime} está casi llena.`,
    url: `/agenda?session=${sessionId}`,
    tag: `session-${sessionId}-lastspot`,
  }
}
