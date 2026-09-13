export type FirebasePublicConfig = {
  apiKey: string
  authDomain: string
  projectId: string
  storageBucket: string
  messagingSenderId: string
  appId: string
}

function readEnv(name: string): string {
  return (import.meta.env[name] as string | undefined)?.trim() ?? ''
}

export function getFirebaseConfig(): FirebasePublicConfig | null {
  const config: FirebasePublicConfig = {
    apiKey: readEnv('VITE_FIREBASE_API_KEY'),
    authDomain: readEnv('VITE_FIREBASE_AUTH_DOMAIN'),
    projectId: readEnv('VITE_FIREBASE_PROJECT_ID'),
    storageBucket: readEnv('VITE_FIREBASE_STORAGE_BUCKET'),
    messagingSenderId: readEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
    appId: readEnv('VITE_FIREBASE_APP_ID'),
  }

  const missing = Object.values(config).some((value) => value.length === 0)
  return missing ? null : config
}

export function isFirebaseConfigured(): boolean {
  return getFirebaseConfig() !== null
}
