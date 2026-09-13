import { Calendar } from 'lucide-react'

import { Button } from '@/components/ui/button'

function App() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <Calendar className="size-10 text-muted-foreground" aria-hidden />
        <h1 className="text-2xl font-semibold tracking-tight">Escala Just</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          Vite + React + TypeScript, Tailwind, shadcn/ui e Lucide — fonte Inter
          (ADR-002).
        </p>
      </div>
      <Button type="button">Continuar</Button>
    </div>
  )
}

export default App
