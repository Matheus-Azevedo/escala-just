import { CircleHelp } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'

export function AjudaFuncao({ texto }: { texto: string }) {
  const [aberto, setAberto] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)
  const notaId = useId()

  useEffect(() => {
    if (!aberto) return
    function fechar(event: MouseEvent) {
      if (!ref.current?.contains(event.target as Node)) setAberto(false)
    }
    document.addEventListener('mousedown', fechar)
    return () => document.removeEventListener('mousedown', fechar)
  }, [aberto])

  return (
    <span ref={ref} className="relative inline-flex align-middle">
      <button
        type="button"
        className="inline-flex size-6 shrink-0 items-center justify-center rounded-full text-muted-foreground"
        aria-expanded={aberto}
        aria-label="Ajuda"
        aria-describedby={aberto ? notaId : undefined}
        onClick={() => setAberto((valor) => !valor)}
      >
        <CircleHelp className="size-4" aria-hidden />
      </button>
      {aberto ? (
        <span
          id={notaId}
          role="note"
          className="absolute top-full left-0 z-20 w-64 rounded-md border bg-background p-2 text-sm shadow"
        >
          {texto}
        </span>
      ) : null}
    </span>
  )
}
