import type { ReactNode } from 'react'
import { Link } from 'react-router'

import { Button } from '@/components/ui/button'

const ITENS = [
  { to: '/editor/semanas', label: 'Semanas' },
  { to: '/editor/oficiais', label: 'Cadastro de oficiais' },
  { to: '/editor/ausencias', label: 'Ausências' },
  { to: '/editor/permutas', label: 'Permutas' },
] as const

export const editorNavHover =
  'hover:border-transparent hover:bg-primary hover:text-primary-foreground'

export function EditorNavButton({
  to,
  children,
  size,
}: {
  to: string
  children: ReactNode
  size?: 'default' | 'sm'
}) {
  return (
    <Button asChild variant="outline" size={size} className={editorNavHover}>
      <Link to={to}>{children}</Link>
    </Button>
  )
}

export function EditorMenu() {
  return (
    <nav className="flex flex-col gap-2" aria-label="Menu da editora">
      {ITENS.map((item) => (
        <EditorNavButton key={item.to} to={item.to}>
          {item.label}
        </EditorNavButton>
      ))}
    </nav>
  )
}
