import type { ReactNode } from 'react'

type AppShellProps = {
  children: ReactNode
  loading?: boolean
  headerAction?: ReactNode
}

export function AppShell({
  children,
  loading = false,
  headerAction,
}: AppShellProps) {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="flex items-center justify-between border-b px-4 py-3">
        <h1 className="text-lg font-semibold tracking-tight">Escala Just</h1>
        {headerAction}
      </header>
      <main className="flex flex-1 flex-col p-6">
        {loading ? (
          <p className="text-sm text-muted-foreground" role="status">
            A carregar sessão…
          </p>
        ) : (
          children
        )}
      </main>
    </div>
  )
}
