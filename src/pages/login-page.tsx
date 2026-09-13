import { type FormEvent, useEffect, useState } from 'react'
import { useNavigate } from 'react-router'

import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/auth-context'

function mensagemErro(error: unknown): string {
  const code =
    typeof error === 'object' && error && 'code' in error
      ? String(error.code)
      : ''
  if (code.includes('invalid-credential') || code.includes('wrong-password') || code.includes('user-not-found')) {
    return 'E-mail ou senha incorretos.'
  }
  if (error instanceof Error && error.message) {
    return error.message
  }
  return 'Não foi possível entrar. Tente novamente.'
}

export function LoginPage() {
  const { state, login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (state.status === 'ready' && state.papel === 'editor') {
      navigate('/editor', { replace: true })
    }
    if (state.status === 'ready' && state.papel === 'leitor') {
      navigate('/leitor', { replace: true })
    }
  }, [navigate, state])

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await login(email, password)
    } catch (cause) {
      setError(mensagemErro(cause))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="mx-auto flex w-full max-w-sm flex-col gap-4">
      <h2 className="text-xl font-semibold">Entrar</h2>
      <p className="text-sm text-muted-foreground">
        Autenticação da central e dos oficiais (T-01).
      </p>
      {state.status === 'no-profile' ? (
        <p className="text-sm text-destructive" role="alert">
          A sessão existe, mas o perfil não está configurado.
        </p>
      ) : null}
      <form className="flex flex-col gap-3" onSubmit={onSubmit}>
        <label className="flex flex-col gap-1 text-sm" htmlFor="login-email">
          E-mail
          <input
            id="login-email"
            className="rounded-md border bg-background px-3 py-2"
            type="email"
            name="email"
            autoComplete="username"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm" htmlFor="login-password">
          Senha
          <input
            id="login-password"
            className="rounded-md border bg-background px-3 py-2"
            type="password"
            name="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        <Button type="submit" disabled={submitting || state.status === 'unconfigured'}>
          {submitting ? 'A entrar…' : 'Entrar'}
        </Button>
      </form>
    </section>
  )
}
