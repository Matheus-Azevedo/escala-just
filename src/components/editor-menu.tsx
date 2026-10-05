import type { ReactNode } from 'react'
import { Link } from 'react-router'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const ITENS = [
  { to: '/editor/semanas', label: 'Semanas' },
  { to: '/editor/ausencias', label: 'Ausências' },
  { to: '/editor/permutas', label: 'Permutas' },
  { to: '/editor/historico', label: 'Histórico' },
  { to: '/editor/oficiais', label: 'Cadastro de oficiais' },
] as const

export const editorNavHover =
  'hover:border-transparent hover:bg-primary hover:text-primary-foreground'

export function EditorNavButton({
  to,
  children,
  size,
  className,
}: {
  to: string
  children: ReactNode
  size?: 'default' | 'sm'
  className?: string
}) {
  return (
    <Button asChild variant="outline" size={size} className={cn(editorNavHover, className)}>
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
