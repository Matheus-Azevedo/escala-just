import { Link } from 'react-router'

import { Button } from '@/components/ui/button'

export function EditorPage() {
  return (
    <section className="mx-auto flex w-full max-w-2xl flex-col gap-3">
      <h2 className="text-xl font-semibold">Área da editora</h2>
      <p className="text-sm text-muted-foreground">
        Placeholder T-02: início das semanas. A geração da escala entra noutra
        change.
      </p>
      <Button asChild variant="outline">
        <Link to="/editor/oficiais">Cadastro de oficiais</Link>
      </Button>
    </section>
  )
}
