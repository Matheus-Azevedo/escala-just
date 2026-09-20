import { type FormEvent, useEffect, useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { useOficiaisService } from '@/hooks/oficiais-context'
import { type Oficial } from '@/lib/escala'
import { OficiaisValidacaoError } from '@/services/oficiais'

function mensagemErro(cause: unknown): string {
  if (cause instanceof OficiaisValidacaoError) return cause.message
  if (cause instanceof Error && cause.message) return cause.message
  return 'Não foi possível gravar o oficial.'
}

export function OficiaisPage() {
  const servico = useOficiaisService()
  const [oficiais, setOficiais] = useState<Oficial[]>([])
  const [nome, setNome] = useState('')
  const [foraDaRotacao, setForaDaRotacao] = useState(false)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [aGravar, setAGravar] = useState(false)
  const [aOrdenar, setAOrdenar] = useState(false)
  const [aRemoverId, setARemoverId] = useState<string | null>(null)
  const [listaPronta, setListaPronta] = useState(false)
  const [mostrarEsqueleto, setMostrarEsqueleto] = useState(false)

  async function recarregar() {
    setOficiais(await servico.listar())
  }

  useEffect(() => {
    let cancelado = false
    const atraso = window.setTimeout(() => {
      if (!cancelado) setMostrarEsqueleto(true)
    }, 150)
    void servico
      .listar()
      .then((lista) => {
        if (!cancelado) setOficiais(lista)
      })
      .catch((cause: unknown) => {
        if (!cancelado) toast.error(mensagemErro(cause))
      })
      .finally(() => {
        window.clearTimeout(atraso)
        if (!cancelado) {
          setListaPronta(true)
          setMostrarEsqueleto(false)
        }
      })
    return () => {
      cancelado = true
      window.clearTimeout(atraso)
    }
  }, [servico])

  function limparFormulario() {
    setNome('')
    setForaDaRotacao(false)
    setEditandoId(null)
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setAGravar(true)
    try {
      if (editandoId) {
        await servico.atualizar(editandoId, { nome, foraDaRotacao })
        toast.success('Oficial actualizado.')
      } else {
        await servico.criar({ nome, foraDaRotacao })
        toast.success('Oficial adicionado.')
      }
      limparFormulario()
      await recarregar()
    } catch (cause) {
      toast.error(mensagemErro(cause))
    } finally {
      setAGravar(false)
    }
  }

  async function onRemover(id: string) {
    setARemoverId(id)
    try {
      await servico.remover(id)
      if (editandoId === id) limparFormulario()
      toast.success('Oficial removido.')
      await recarregar()
    } catch (cause) {
      toast.error(mensagemErro(cause))
    } finally {
      setARemoverId(null)
    }
  }

  async function onOrdenar() {
    setAOrdenar(true)
    try {
      setOficiais(await servico.ordenarAlfabetico())
      toast.success('Lista ordenada por nome.')
    } catch (cause) {
      toast.error(mensagemErro(cause))
    } finally {
      setAOrdenar(false)
    }
  }

  const lista = [...oficiais].sort((a, b) => a.ordemTitular - b.ordemTitular)
  const ocupado = aGravar || aOrdenar || aRemoverId !== null

  return (
    <section className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <h2 className="text-xl font-semibold">Cadastro de oficiais</h2>
      <p className="text-sm text-muted-foreground">
        T-04: até 24 na rotação. Quem está fora da escala não conta nesse teto.
      </p>

      <form className="flex flex-col gap-3 rounded-lg border p-3" onSubmit={onSubmit}>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="oficial-nome">Nome</Label>
          <Input
            id="oficial-nome"
            value={nome}
            onChange={(event) => setNome(event.target.value)}
            autoComplete="off"
          />
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="oficial-fora"
            checked={foraDaRotacao}
            onCheckedChange={(value) => setForaDaRotacao(value === true)}
          />
          <Label htmlFor="oficial-fora">Fora da rotação</Label>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" pending={aGravar} disabled={ocupado}>
            {editandoId ? 'Guardar' : 'Adicionar'}
          </Button>
          {editandoId ? (
            <Button type="button" variant="outline" onClick={limparFormulario} disabled={ocupado}>
              Cancelar
            </Button>
          ) : null}
          <Button
            type="button"
            variant="secondary"
            onClick={() => void onOrdenar()}
            pending={aOrdenar}
            disabled={ocupado}
          >
            Ordenar por nome
          </Button>
        </div>
      </form>

      {!listaPronta && mostrarEsqueleto ? (
        <ul className="flex flex-col gap-2" aria-busy="true" aria-label="A carregar oficiais">
          {[0, 1, 2].map((indice) => (
            <li key={indice} className="flex flex-col gap-2 rounded-md border px-3 py-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-56" />
            </li>
          ))}
        </ul>
      ) : null}

      {listaPronta && lista.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum oficial cadastrado.</p>
      ) : null}

      {listaPronta && lista.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {lista.map((oficial) => (
            <li
              key={oficial.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2"
            >
              <div>
                <p className="font-medium">{oficial.nome}</p>
                <p className="text-xs text-muted-foreground">
                  Titular {oficial.ordemTitular} · Suplente {oficial.ordemSuplente}
                  {oficial.foraDaRotacao ? ' · fora da rotação' : ''}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={ocupado}
                  onClick={() => {
                    setEditandoId(oficial.id)
                    setNome(oficial.nome)
                    setForaDaRotacao(oficial.foraDaRotacao)
                  }}
                >
                  Editar
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  pending={aRemoverId === oficial.id}
                  disabled={ocupado}
                  onClick={() => void onRemover(oficial.id)}
                >
                  Remover
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  )
}
