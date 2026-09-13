import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'

import { isPapel, type Papel } from '@/lib/escala'
import { isFirebaseConfigured } from '@/lib/firebase-config'

import { getFirebaseAuth, getFirebaseDb } from './firebase'

export type AuthSession = {
  uid: string
  email: string
}

export type AuthService = {
  isConfigured: () => boolean
  subscribe: (onChange: (session: AuthSession | null) => void) => () => void
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  fetchPapel: (uid: string) => Promise<Papel | null>
}

export function createFirebaseAuthService(): AuthService {
  return {
    isConfigured: isFirebaseConfigured,
    subscribe(onChange) {
      if (!isFirebaseConfigured()) {
        onChange(null)
        return () => {}
      }
      return onAuthStateChanged(getFirebaseAuth(), (user) => {
        onChange(user ? { uid: user.uid, email: user.email ?? '' } : null)
      })
    },
    async login(email, password) {
      await signInWithEmailAndPassword(getFirebaseAuth(), email, password)
    },
    async logout() {
      await signOut(getFirebaseAuth())
    },
    async fetchPapel(uid) {
      const snap = await getDoc(doc(getFirebaseDb(), 'usuarios', uid))
      if (!snap.exists()) return null
      const papel = snap.data()?.papel
      return isPapel(papel) ? papel : null
    },
  }
}

export function createMemoryAuthService(options?: {
  configured?: boolean
  session?: AuthSession | null
  papel?: Papel | null
}): AuthService {
  let session = options?.session ?? null
  const papel = options?.papel ?? null
  const listeners = new Set<(next: AuthSession | null) => void>()
  const configured = options?.configured ?? true

  return {
    isConfigured: () => configured,
    subscribe(onChange) {
      listeners.add(onChange)
      onChange(session)
      return () => {
        listeners.delete(onChange)
      }
    },
    async login(email) {
      if (!configured) {
        throw new Error('Firebase não configurado. Copie .env.example para .env.local.')
      }
      if (email.includes('invalido')) {
        throw new Error('Credenciais inválidas.')
      }
      session = { uid: 'uid-teste', email }
      listeners.forEach((listener) => listener(session))
    },
    async logout() {
      session = null
      listeners.forEach((listener) => listener(null))
    },
    async fetchPapel() {
      return papel
    },
  }
}
