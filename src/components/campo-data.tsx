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
    <div className="flex gap-2">
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
      <Input
        type="date"
        lang="pt-BR"
        disabled={disabled}
        value={value}
        aria-label="Abrir calendário"
        className="w-10 shrink-0 px-1 [&::-webkit-datetime-edit]:hidden [&::-webkit-calendar-picker-indicator]:m-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
        onChange={(event) => {
          onChange(event.target.value)
          setRascunho(null)
        }}
      />
    </div>
  )
}
