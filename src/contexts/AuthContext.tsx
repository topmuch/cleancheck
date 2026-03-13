"use client"

import { createContext, useContext, useMemo, ReactNode } from "react"
import { useSession, signOut as nextAuthSignOut } from "next-auth/react"

interface User {
  id: string
  email: string
  name: string | null
  role: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession()

  const user = useMemo(() => {
    if (session?.user) {
      return {
        id: session.user.id,
        email: session.user.email || "",
        name: session.user.name || null,
        role: (session.user as any).role || "CLIENT"
      }
    }
    return null
  }, [session])

  const loading = status === "loading"

  const signOut = async () => {
    await nextAuthSignOut({ callbackUrl: "/" })
  }

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth doit être utilisé dans un AuthProvider")
  }
  return context
}
