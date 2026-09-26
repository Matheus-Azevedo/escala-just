import { useState } from 'react'

import { Input } from '@/components/ui/input'
import { formatarDiaBr, parseDiaBr } from '@/lib/escala'

type CampoDataProps = {
  id: string
  value: string
  onChange: (iso: string) => void
  disabled?: boolean
}

export function CampoData({ id, value, onChange, disabled }: CampoDataProps) {
  const [rascunho, setRascunho] = useState<string | null>(null)
  const mostrado = rascunho ?? (value ? formatarDiaBr(value) : '')

  return (
    <Input
      id={id}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      placeholder="dd/mm/aaaa"
      disabled={disabled}
      value={mostrado}
      onChange={(event) => {
        const seguinte = event.target.value
        setRascunho(seguinte)
        if (seguinte.trim() === '') {
          onChange('')
          return
        }
        const iso = parseDiaBr(seguinte)
        if (iso) onChange(iso)
      }}
      onBlur={() => {
        setRascunho(null)
      }}
    />
  )
}
