import { EditorNavButton } from '@/components/editor-menu'

export function LeitorPage() {
  return (
    <section className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <h2 className="text-xl font-semibold">Consulta da escala</h2>
      <p className="text-sm text-muted-foreground">Escolha o que quer ver. Só leitura.</p>
      <nav className="flex flex-col gap-2" aria-label="Consulta do leitor">
        <EditorNavButton to="/leitor/dias">Meus dias</EditorNavButton>
        <EditorNavButton to="/leitor/semanas">Semanas</EditorNavButton>
      </nav>
    </section>
  )
}
