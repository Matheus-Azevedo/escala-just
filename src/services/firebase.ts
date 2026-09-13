import { getApps, initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

import { getFirebaseConfig } from '@/lib/firebase-config'

export function getFirebaseApp() {
  const config = getFirebaseConfig()
  if (!config) {
    throw new Error(
      'Firebase não configurado. Copie .env.example para .env.local.',
    )
  }
  return getApps()[0] ?? initializeApp(config)
}

export function getFirebaseAuth() {
  return getAuth(getFirebaseApp())
}

export function getFirebaseDb() {
  return getFirestore(getFirebaseApp())
}
