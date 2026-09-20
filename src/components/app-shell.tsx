import { Loader2 } from 'lucide-react'
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
      <header className="relative flex items-center justify-between border-b px-4 py-3">
        <h1 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          Escala Just
          {loading ? (
            <Loader2 className="size-4 animate-spin text-muted-foreground" aria-hidden />
          ) : null}
        </h1>
        {headerAction}
        {loading ? (
          <div
            className="absolute inset-x-0 bottom-0 h-0.5 overflow-hidden bg-primary/15"
            role="status"
            aria-label="A carregar sessão"
          >
            <div className="h-full w-1/3 animate-[session-bar_1.1s_ease-in-out_infinite] bg-primary" />
          </div>
        ) : null}
      </header>
      <main className="flex flex-1 flex-col p-6">{children}</main>
    </div>
  )
}
