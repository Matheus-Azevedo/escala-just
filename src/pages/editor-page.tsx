import { Link } from 'react-router'

import { Button } from '@/components/ui/button'

export function EditorPage() {
  return (
    <section className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <h2 className="text-xl font-semibold">Área da editora</h2>
      <p className="text-sm text-muted-foreground">
        Escolha o que pretende gerir. A criação de semanas e o cadastro ficam
        nas páginas seguintes.
      </p>
      <Button asChild variant="outline">
        <Link to="/editor/semanas">Semanas</Link>
      </Button>
      <Button asChild variant="outline">
        <Link to="/editor/oficiais">Cadastro de oficiais</Link>
      </Button>
    </section>
  )
}
