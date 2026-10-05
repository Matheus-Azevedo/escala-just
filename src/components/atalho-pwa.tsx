import { useEffect, useState } from 'react'

import { editorNavHover } from '@/components/editor-menu'
import { Button } from '@/components/ui/button'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
}

function emStandalone(): boolean {
  if (window.matchMedia('(display-mode: standalone)').matches) return true
  const nav = navigator as Navigator & { standalone?: boolean }
  return Boolean(nav.standalone)
}

export function AtalhoPwa() {
  const [evento, setEvento] = useState<BeforeInstallPromptEvent | null>(null)
  const [standalone] = useState(emStandalone)

  useEffect(() => {
    function onPrompt(event: Event) {
      event.preventDefault()
      setEvento(event as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    return () => window.removeEventListener('beforeinstallprompt', onPrompt)
  }, [])

  if (standalone) return null

  if (evento) {
    return (
      <Button
        type="button"
        variant="outline"
        className={`w-full ${editorNavHover}`}
        onClick={() => {
          void evento.prompt()
        }}
      >
        Adicionar à tela inicial
      </Button>
    )
  }

  return (
    <div className="flex flex-col gap-1 text-center text-sm text-muted-foreground">
      <p>Para criar o ícone na tela inicial:</p>
      <p>No iPhone, toque em Partilhar e depois em Adicionar à Tela de Início.</p>
      <p>No Android, abra o menu do browser e escolha adicionar à tela inicial.</p>
    </div>
  )
}
