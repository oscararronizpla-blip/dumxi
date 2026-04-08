// ─── DUMXI · Auth Middleware ──────────────────────────────────────────────────
// middleware.ts — Next.js edge middleware
//
// REGLA DE ACCESO:
//   ✅ Anónimo puede navegar TODO sin restricción
//   ✅ Anónimo puede usar el formulario de contacto
//   🔒 Se pide login/registro SOLO en 2 momentos:
//      1. Al pulsar el icono de usuario (va a /auth)
//      2. Justo antes de la pasarela de pago (/checkout → redirect a /auth?next=checkout&session=X)
//
// El middleware NO bloquea rutas públicas — solo protege /dashboard, /admin y /checkout.
// La redirección preserva el destino en ?next= para continuar tras el login.

import { NextRequest, NextResponse } from "next/server"

// Rutas que requieren autenticación
const PROTECTED = [
  "/dashboard",
  "/admin",
  "/checkout",       // justo antes del pago → redirige a login, luego vuelve
]

// Rutas de la API que requieren autenticación
const PROTECTED_API = [
  "/api/admin",
  "/api/sessions/book",
  "/api/push/subscribe",
  "/api/get-video-url",
]

export function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl

  // Check if route needs protection
  const needsAuth =
    PROTECTED.some(p => pathname.startsWith(p)) ||
    PROTECTED_API.some(p => pathname.startsWith(p))

  if (!needsAuth) return NextResponse.next()

  // Read session cookie set by Firebase Auth
  const session = req.cookies.get("__session")?.value

  if (!session) {
    // For API routes → 401
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // For /checkout → preserve session param so user lands back after login
    const sessionId = searchParams.get("sessionId")
    const next = sessionId
      ? `/checkout?sessionId=${sessionId}`
      : pathname

    return NextResponse.redirect(
      new URL(`/auth?next=${encodeURIComponent(next)}`, req.url)
    )
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/checkout/:path*",
    "/api/admin/:path*",
    "/api/sessions/:path*",
    "/api/push/:path*",
    "/api/get-video-url/:path*",
  ],
}
