/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo, type ReactNode } from 'react'

import {
  createFirebaseCelulasService,
  type CelulasService,
} from '@/services/celulas'

const CelulasContext = createContext<CelulasService | null>(null)

export function CelulasProvider({
  children,
  service,
}: {
  children: ReactNode
  service?: CelulasService
}) {
  const value = useMemo(
    () => service ?? createFirebaseCelulasService(),
    [service],
  )
  return <CelulasContext.Provider value={value}>{children}</CelulasContext.Provider>
}

export function useCelulasService(): CelulasService {
  const context = useContext(CelulasContext)
  if (!context) {
    throw new Error('useCelulasService deve ser usado dentro de CelulasProvider')
  }
  return context
}
