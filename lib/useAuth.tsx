"use client"
// ─── DUMXI · useAuth hook ─────────────────────────────────────────────────────
// Gestiona el estado de autenticación con Firebase Google Auth.
// Solo Google Sign-In. Registro completo con datos adicionales tras primer login.

import { useState, useEffect, createContext, useContext } from "react"
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth"
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
import { COLLECTIONS } from "@/lib/constants"
import type { UserProfile } from "@/lib/session-types"

interface AuthState {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  needsOnboarding: boolean   // true if logged in but profile incomplete
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  completeOnboarding: (data: OnboardingData) => Promise<void>
}

export interface OnboardingData {
  nombre: string
  apellidos: string
  telefono: string
  ciudad: string
  pais: string
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [needsOnboarding, setNeedsOnboarding] = useState(false)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)

      if (firebaseUser) {
        // Set session cookie for middleware
        const token = await firebaseUser.getIdToken()
        await fetch("/api/auth/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        })

        // Load Firestore profile
        const profileDoc = await getDoc(
          doc(db, COLLECTIONS.users, firebaseUser.uid)
        )

        if (profileDoc.exists()) {
          const data = profileDoc.data() as UserProfile
          setProfile(data)
          // Check if onboarding complete (has phone = fully registered)
          setNeedsOnboarding(!data.telefono)
        } else {
          // First login — needs onboarding
          setNeedsOnboarding(true)
          setProfile(null)
        }
      } else {
        setProfile(null)
        setNeedsOnboarding(false)
        // Clear session cookie
        await fetch("/api/auth/session", { method: "DELETE" })
      }

      setLoading(false)
    })

    return () => unsub()
  }, [])

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider()
    provider.addScope("email")
    provider.addScope("profile")
    await signInWithPopup(auth, provider)
    // onAuthStateChanged will handle the rest
  }

  const completeOnboarding = async (data: OnboardingData) => {
    if (!user) return

    const profileData: UserProfile = {
      uid: user.uid,
      email: user.email!,
      displayName: `${data.nombre} ${data.apellidos}`,
      nombre: data.nombre,
      apellidos: data.apellidos,
      telefono: data.telefono,
      ciudad: data.ciudad,
      pais: data.pais,
      purchasedCourses: [],
      bookedSessions: [],
      courseProgress: 0,
      courseCompleted: false,
      isAdmin: user.uid === process.env.NEXT_PUBLIC_ADMIN_UID,
      createdAt: new Date().toISOString(),
    }

    await setDoc(doc(db, COLLECTIONS.users, user.uid), profileData)
    setProfile(profileData)
    setNeedsOnboarding(false)
  }

  const signOut = async () => {
    await firebaseSignOut(auth)
  }

  return (
    <AuthContext.Provider value={{
      user, profile, loading, needsOnboarding,
      signInWithGoogle, signOut, completeOnboarding,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider")
  return ctx
}
