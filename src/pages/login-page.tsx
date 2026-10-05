import { type FormEvent, useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'

import { AtalhoPwa } from '@/components/atalho-pwa'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
    setSubmitting(true)
    try {
      await login(email, password)
    } catch (cause) {
      toast.error(mensagemErro(cause))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="mx-auto flex w-full max-w-sm flex-col gap-4">
      <h2 className="text-xl font-semibold">Entrar</h2>
      <p className="text-sm text-muted-foreground">
        Autenticação da central e dos oficiais.
      </p>
      {state.status === 'no-profile' ? (
        <p className="text-sm text-muted-foreground" role="status">
          A sessão existe, mas o perfil não está configurado.
        </p>
      ) : null}
      <form className="flex flex-col gap-3" onSubmit={onSubmit}>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="login-email">E-mail</Label>
          <Input
            id="login-email"
            type="email"
            name="email"
            autoComplete="username"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="login-password">Senha</Label>
          <Input
            id="login-password"
            type="password"
            name="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>
        <Button
          type="submit"
          pending={submitting}
          disabled={state.status === 'unconfigured'}
        >
          Entrar
        </Button>
      </form>
      <AtalhoPwa />
    </section>
  )
}
