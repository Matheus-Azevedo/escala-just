import { type FormEvent, useEffect, useState } from 'react'
import { Link } from 'react-router'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { useSemanasService } from '@/hooks/semanas-context'
import { type SemanaEscala } from '@/lib/escala'
import { SemanasValidacaoError } from '@/services/semanas'

function mensagemErro(cause: unknown): string {
  if (cause instanceof SemanasValidacaoError) return cause.message
  if (cause instanceof Error && cause.message) return cause.message
  return 'Não foi possível gravar a semana.'
}

function rotuloIntervalo(semana: SemanaEscala): string {
  return `${semana.dataInicio} a ${semana.dataFim}`
}

export function SemanasListaPage() {
  const servico = useSemanasService()
  const [semanas, setSemanas] = useState<SemanaEscala[]>([])
  const [dataEscolhida, setDataEscolhida] = useState('')
  const [aGravar, setAGravar] = useState(false)
  const [aRemoverId, setARemoverId] = useState<string | null>(null)
  const [listaPronta, setListaPronta] = useState(false)
  const [mostrarEsqueleto, setMostrarEsqueleto] = useState(false)

  async function recarregar() {
    setSemanas(await servico.listar())
  }

  useEffect(() => {
    let cancelado = false
    const atraso = window.setTimeout(() => {
      if (!cancelado) setMostrarEsqueleto(true)
    }, 150)
    void servico
      .listar()
      .then((lista) => {
        if (!cancelado) setSemanas(lista)
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

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setAGravar(true)
    try {
      await servico.criar({ dataEscolhida })
      toast.success('Semana criada.')
      setDataEscolhida('')
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
      toast.success('Rascunho removido.')
      await recarregar()
    } catch (cause) {
      toast.error(mensagemErro(cause))
    } finally {
      setARemoverId(null)
    }
  }

  const lista = [...semanas].sort((a, b) => b.dataInicio.localeCompare(a.dataInicio))
  const ocupado = aGravar || aRemoverId !== null

  return (
    <section className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <h2 className="text-xl font-semibold">Semanas</h2>
      <p className="text-sm text-muted-foreground">
        T-02: escolha uma data; a escala fica na segunda a sexta dessa semana.
        A geração da grade entra noutra change.
      </p>

      <form className="flex flex-col gap-3 rounded-lg border p-3" onSubmit={onSubmit}>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="semana-data">Data de referência</Label>
          <Input
            id="semana-data"
            type="date"
            value={dataEscolhida}
            onChange={(event) => setDataEscolhida(event.target.value)}
          />
        </div>
        <Button type="submit" pending={aGravar} disabled={ocupado || !dataEscolhida}>
          Criar semana
        </Button>
      </form>

      {!listaPronta && mostrarEsqueleto ? (
        <ul className="flex flex-col gap-2" aria-busy="true" aria-label="A carregar semanas">
          {[0, 1].map((indice) => (
            <li key={indice} className="flex flex-col gap-2 rounded-md border px-3 py-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-24" />
            </li>
          ))}
        </ul>
      ) : null}

      {listaPronta && lista.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma semana criada.</p>
      ) : null}

      {listaPronta && lista.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {lista.map((semana) => (
            <li
              key={semana.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2"
            >
              <div>
                <p className="font-medium">{rotuloIntervalo(semana)}</p>
                <p className="text-xs text-muted-foreground">{semana.estado}</p>
              </div>
              <div className="flex gap-2">
                <Button asChild size="sm" variant="outline">
                  <Link to={`/editor/semanas/${semana.id}`}>Parâmetros</Link>
                </Button>
                {semana.estado === 'rascunho' ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    pending={aRemoverId === semana.id}
                    disabled={ocupado}
                    onClick={() => void onRemover(semana.id)}
                  >
                    Remover
                  </Button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      <Button asChild variant="outline">
        <Link to="/editor">Voltar</Link>
      </Button>
    </section>
  )
}
