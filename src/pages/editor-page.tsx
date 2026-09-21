import { EditorMenu } from '@/components/editor-menu'

export function EditorPage() {
  return (
    <section className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <h2 className="text-xl font-semibold">Área da editora</h2>
      <p className="text-sm text-muted-foreground">
        Escolha o que pretende gerir. A criação de semanas e o cadastro ficam
        nas páginas seguintes.
      </p>
      <EditorMenu />
    </section>
  )
}
