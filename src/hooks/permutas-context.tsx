/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo, type ReactNode } from 'react'

import {
  createFirebasePermutasService,
  type PermutasService,
} from '@/services/permutas'

const PermutasContext = createContext<PermutasService | null>(null)

export function PermutasProvider({
  children,
  service,
}: {
  children: ReactNode
  service?: PermutasService
}) {
  const value = useMemo(
    () => service ?? createFirebasePermutasService(),
    [service],
  )
  return <PermutasContext.Provider value={value}>{children}</PermutasContext.Provider>
}

export function usePermutasService(): PermutasService {
  const context = useContext(PermutasContext)
  if (!context) {
    throw new Error('usePermutasService deve ser usado dentro de PermutasProvider')
  }
  return context
}
