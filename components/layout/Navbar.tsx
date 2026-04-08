"use client"
// ─── DUMXI · Navbar ───────────────────────────────────────────────────────────
// Barra de navegación estática en toda la web.
// - Usuario anónimo: puede navegar libremente. Solo el icono de usuario
//   superior derecho lleva a /auth.
// - Usuario autenticado: muestra nombre + menú desplegable con dashboard y logout.
// - El formulario de contacto NO requiere login — es accesible a todos.

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/useAuth"

export default function Navbar() {
  const { user, profile, loading, signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const navLinks = [
    { href: "/", label: "Inicio" },
    { href: "/agenda", label: "Clases en vivo" },
    { href: "/courses/dumxi-v1", label: "Curso online" },
    { href: "/contacto", label: "Contacto" },
  ]

  return (
    <nav style={{
      position: "sticky", top: 0, zIndex: 100,
      background: "rgba(242,240,238,0.92)",
      backdropFilter: "blur(12px)",
      borderBottom: "1px solid rgba(0,0,0,0.07)",
      fontFamily: "Calibri, sans-serif",
    }}>
      <div style={{
        maxWidth: 1100, margin: "0 auto",
        padding: "0 20px", height: 58,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>

        {/* Logo */}
        <Link href="/" style={{ textDecoration: "none" }}>
          <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: "-1.5px", color: "#0a0a0f" }}>
            DUM<span style={{ color: "#dc143c" }}>XI</span>
          </div>
        </Link>

        {/* Nav links */}
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {navLinks.map(link => (
            <Link key={link.href} href={link.href} style={{
              padding: "6px 12px", borderRadius: 8,
              fontSize: 14, fontWeight: 600, color: "#3a3a4a",
              textDecoration: "none",
              transition: "background 0.15s, color 0.15s",
            }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLAnchorElement).style.background = "rgba(220,20,60,0.07)"
                ;(e.currentTarget as HTMLAnchorElement).style.color = "#dc143c"
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLAnchorElement).style.background = "transparent"
                ;(e.currentTarget as HTMLAnchorElement).style.color = "#3a3a4a"
              }}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* User icon — right corner */}
        <div ref={menuRef} style={{ position: "relative" }}>
          {loading ? (
            <div style={{ width: 34, height: 34 }} />
          ) : user && profile ? (
            // ── Logged in: avatar + dropdown ──────────────────────────────
            <button
              onClick={() => setMenuOpen(v => !v)}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "5px 10px 5px 5px",
                borderRadius: 20, border: "1.5px solid #e0ddd9",
                background: "#fff", cursor: "pointer",
                fontFamily: "inherit", transition: "border-color 0.15s",
              }}
              onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.borderColor = "#dc143c"}
              onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.borderColor = "#e0ddd9"}
            >
              {/* Avatar */}
              <div style={{
                width: 26, height: 26, borderRadius: "50%",
                background: "linear-gradient(135deg,#b00020,#dc143c)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 700, color: "#fff", flexShrink: 0,
                overflow: "hidden",
              }}>
                {user.photoURL
                  ? <img src={user.photoURL} width={26} height={26} alt="" style={{ borderRadius: "50%", display: "block" }} />
                  : (profile.nombre?.[0] ?? user.email?.[0] ?? "U").toUpperCase()
                }
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#0a0a0f", maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {profile.nombre}
              </span>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0, transform: menuOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}>
                <path d="M2 4l4 4 4-4" stroke="#86868b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          ) : (
            // ── Anonymous: user icon → /auth ──────────────────────────────
            <Link href="/auth" style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: 36, height: 36, borderRadius: "50%",
              border: "1.5px solid #e0ddd9", background: "#fff",
              textDecoration: "none", transition: "border-color 0.15s",
            }}
              onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.borderColor = "#dc143c"}
              onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.borderColor = "#e0ddd9"}
              title="Iniciar sesión"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6e6e7e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </Link>
          )}

          {/* Dropdown menu */}
          {menuOpen && user && (
            <div style={{
              position: "absolute", top: "calc(100% + 8px)", right: 0,
              background: "#fff", borderRadius: 12,
              border: "1px solid #e8e5e2",
              boxShadow: "3px 6px 24px rgba(0,0,0,0.10)",
              minWidth: 200, overflow: "hidden",
              animation: "fadeDown 0.15s ease",
            }}>
              {/* User info */}
              <div style={{ padding: "12px 14px", borderBottom: "1px solid #f0eeeb" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0a0a0f" }}>{profile?.displayName}</div>
                <div style={{ fontSize: 11, color: "#86868b", marginTop: 2 }}>{user.email}</div>
              </div>

              {/* Menu items */}
              {[
                { href: "/dashboard", icon: "📚", label: "Mi área de alumno" },
                { href: "/agenda", icon: "📅", label: "Agenda de clases" },
                ...(profile?.isAdmin ? [{ href: "/admin", icon: "⚙️", label: "Panel de administración" }] : []),
              ].map(item => (
                <Link key={item.href} href={item.href}
                  onClick={() => setMenuOpen(false)}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "10px 14px", fontSize: 13, color: "#3a3a4a",
                    textDecoration: "none", transition: "background 0.1s",
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.background = "#f8f6f4"}
                  onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.background = "transparent"}
                >
                  <span style={{ fontSize: 15 }}>{item.icon}</span> {item.label}
                </Link>
              ))}

              {/* Sign out */}
              <button
                onClick={() => { signOut(); setMenuOpen(false) }}
                style={{
                  width: "100%", padding: "10px 14px",
                  display: "flex", alignItems: "center", gap: 10,
                  fontSize: 13, color: "#dc143c",
                  background: "none", border: "none", borderTop: "1px solid #f0eeeb",
                  cursor: "pointer", fontFamily: "inherit", textAlign: "left",
                  transition: "background 0.1s",
                }}
                onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = "#fff5f6"}
                onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = "transparent"}
              >
                <span style={{ fontSize: 15 }}>↩</span> Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeDown {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </nav>
  )
}
