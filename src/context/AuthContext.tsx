import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { toMessage } from '../lib/errors.ts'
import { getFirebaseAuth, getFirebaseDb, isFirebaseConfigured } from '../lib/firebase.ts'

interface AuthState {
  user: User | null
  isAdmin: boolean
  loading: boolean
  notice: string | null
  configured: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOutAdmin: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(isFirebaseConfigured)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    if (!isFirebaseConfigured) return
    return onAuthStateChanged(getFirebaseAuth(), (next) => {
      void (async () => {
        if (!next) {
          setUser(null)
          setIsAdmin(false)
          setLoading(false)
          return
        }
        try {
          const snapshot = await getDoc(doc(getFirebaseDb(), 'admins', next.uid))
          if (!snapshot.exists()) {
            setNotice('هذا الحساب غير مخوّل لإدارة الشاشة. تُضاف حسابات الإدارة يدوياً داخل مجموعة admins.')
            await signOut(getFirebaseAuth())
            return
          }
          setNotice(null)
          setUser(next)
          setIsAdmin(true)
          setLoading(false)
        } catch (error) {
          setNotice(toMessage(error))
          await signOut(getFirebaseAuth())
        }
      })()
    })
  }, [])

  const value = useMemo<AuthState>(
    () => ({
      user,
      isAdmin,
      loading,
      notice,
      configured: isFirebaseConfigured,
      signIn: async (email, password) => {
        if (!isFirebaseConfigured) {
          throw new Error('Firebase غير مربوط بعد. أكملوا الإعداد قبل تسجيل الدخول.')
        }
        setLoading(true)
        try {
          await signInWithEmailAndPassword(getFirebaseAuth(), email.trim(), password)
        } catch (error) {
          setLoading(false)
          throw error
        }
      },
      signOutAdmin: async () => {
        if (isFirebaseConfigured) await signOut(getFirebaseAuth())
      },
    }),
    [user, isAdmin, loading, notice],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const value = useContext(AuthContext)
  if (!value) throw new Error('AuthProvider missing')
  return value
}
