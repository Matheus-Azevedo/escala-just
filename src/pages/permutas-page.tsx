import { type FormEvent, useEffect, useState } from 'react'
import { toast } from 'sonner'

import { CampoData } from '@/components/campo-data'
import { editorNavHover, EditorNavButton } from '@/components/editor-menu'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { useOficiaisService } from '@/hooks/oficiais-context'
import { usePermutasService } from '@/hooks/permutas-context'
import {
  formatarIntervaloBr,
  type Oficial,
  type PapelPermuta,
  type Permuta,
} from '@/lib/escala'
import { PermutasValidacaoError } from '@/services/permutas'

const PAPEIS: { valor: PapelPermuta; rotulo: string }[] = [
  { valor: 'titular', rotulo: 'Titular' },
  { valor: 'suplente', rotulo: 'Suplente' },
  { valor: 'ambos', rotulo: 'Ambos' },
]

function rotuloPapel(papel: PapelPermuta): string {
  return PAPEIS.find((item) => item.valor === papel)?.rotulo ?? papel
}

function mensagemErro(cause: unknown): string {
  if (cause instanceof PermutasValidacaoError) return cause.message
  if (cause instanceof Error && cause.message) return cause.message
  return 'Não foi possível gravar a permuta.'
}

export function PermutasPage() {
  const servico = usePermutasService()
  const oficiaisServico = useOficiaisService()
  const [permutas, setPermutas] = useState<Permuta[]>([])
  const [oficiais, setOficiais] = useState<Oficial[]>([])
  const [afetadoId, setAfetadoId] = useState('')
  const [substitutoId, setSubstitutoId] = useState('')
  const [papel, setPapel] = useState<PapelPermuta>('titular')
  const [observacao, setObservacao] = useState('')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [aGravar, setAGravar] = useState(false)
  const [aRemoverId, setARemoverId] = useState<string | null>(null)
  const [listaPronta, setListaPronta] = useState(false)
  const [mostrarEsqueleto, setMostrarEsqueleto] = useState(false)

  function limparFormulario() {
    setEditandoId(null)
    setAfetadoId('')
    setSubstitutoId('')
    setPapel('titular')
    setObservacao('')
    setDataInicio('')
    setDataFim('')
  }

  async function recarregar() {
    setPermutas(await servico.listar())
  }

  useEffect(() => {
    let cancelado = false
    const atraso = window.setTimeout(() => {
      if (!cancelado) setMostrarEsqueleto(true)
    }, 150)
    void Promise.all([servico.listar(), oficiaisServico.listar()])
      .then(([lista, gente]) => {
        if (!cancelado) {
          setPermutas(lista)
          setOficiais(gente)
        }
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
  }, [servico, oficiaisServico])

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setAGravar(true)
    try {
      const draft = { afetadoId, substitutoId, papel, dataInicio, dataFim, observacao }
      if (editandoId) {
        await servico.atualizar(editandoId, draft)
        toast.success('Permuta actualizada.')
      } else {
        await servico.criar(draft)
        toast.success('Permuta criada.')
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
      toast.success('Permuta removida.')
      await recarregar()
    } catch (cause) {
      toast.error(mensagemErro(cause))
    } finally {
      setARemoverId(null)
    }
  }

  const ocupado = aGravar || aRemoverId !== null
  const nomeOficial = (id: string) =>
    oficiais.find((oficial) => oficial.id === id)?.nome ?? id

  return (
    <section className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <h2 className="text-xl font-semibold">Permutas</h2>
      <p className="text-sm text-muted-foreground">
        T-07: quem cobre quem. A geração da grade usa estes acordos noutra change.
      </p>

      <form className="flex flex-col gap-3 rounded-lg border p-3" onSubmit={onSubmit}>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="permuta-afetado">Oficial afetado</Label>
          <select
            id="permuta-afetado"
            className="h-8 rounded-lg border border-border bg-background px-2.5 text-sm"
            value={afetadoId}
            onChange={(event) => setAfetadoId(event.target.value)}
          >
            <option value="">Escolher…</option>
            {oficiais.map((oficial) => (
              <option key={oficial.id} value={oficial.id}>
                {oficial.nome}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="permuta-substituto">Quem assume</Label>
          <select
            id="permuta-substituto"
            className="h-8 rounded-lg border border-border bg-background px-2.5 text-sm"
            value={substitutoId}
            onChange={(event) => setSubstitutoId(event.target.value)}
          >
            <option value="">Escolher…</option>
            {oficiais.map((oficial) => (
              <option key={oficial.id} value={oficial.id}>
                {oficial.nome}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="permuta-papel">Papel</Label>
          <select
            id="permuta-papel"
            className="h-8 rounded-lg border border-border bg-background px-2.5 text-sm"
            value={papel}
            onChange={(event) => setPapel(event.target.value as PapelPermuta)}
          >
            {PAPEIS.map((item) => (
              <option key={item.valor} value={item.valor}>
                {item.rotulo}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="permuta-inicio">Início</Label>
          <CampoData
            key={`inicio-${editandoId ?? 'novo'}`}
            id="permuta-inicio"
            value={dataInicio}
            onChange={setDataInicio}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="permuta-fim">Fim</Label>
          <CampoData
            key={`fim-${editandoId ?? 'novo'}`}
            id="permuta-fim"
            value={dataFim}
            onChange={setDataFim}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="permuta-obs">Observação (opcional)</Label>
          <Input
            id="permuta-obs"
            value={observacao}
            maxLength={120}
            placeholder="Ex.: combinado na central…"
            onChange={(event) => setObservacao(event.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="submit"
            pending={aGravar}
            disabled={ocupado || !afetadoId || !substitutoId || !dataInicio || !dataFim}
          >
            {editandoId ? 'Guardar' : 'Adicionar'}
          </Button>
          {editandoId ? (
            <Button type="button" variant="outline" className={editorNavHover} onClick={limparFormulario}>
              Cancelar
            </Button>
          ) : null}
        </div>
      </form>

      {!listaPronta && mostrarEsqueleto ? (
        <ul className="flex flex-col gap-2" aria-busy="true" aria-label="A carregar permutas">
          {[0, 1].map((indice) => (
            <li key={indice} className="flex flex-col gap-2 rounded-md border px-3 py-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-28" />
            </li>
          ))}
        </ul>
      ) : null}

      {listaPronta && permutas.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma permuta registada.</p>
      ) : null}

      {listaPronta && permutas.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {permutas.map((permuta) => (
            <li
              key={permuta.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2"
            >
              <div>
                <p className="font-medium">
                  {nomeOficial(permuta.substitutoId)} cobre {nomeOficial(permuta.afetadoId)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {rotuloPapel(permuta.papel)}
                  {permuta.observacao ? ` — ${permuta.observacao}` : ''} ·{' '}
                  {formatarIntervaloBr(permuta.dataInicio, permuta.dataFim)}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className={editorNavHover}
                  disabled={ocupado}
                  onClick={() => {
                    setEditandoId(permuta.id)
                    setAfetadoId(permuta.afetadoId)
                    setSubstitutoId(permuta.substitutoId)
                    setPapel(permuta.papel)
                    setObservacao(permuta.observacao ?? '')
                    setDataInicio(permuta.dataInicio)
                    setDataFim(permuta.dataFim)
                  }}
                >
                  Editar
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  pending={aRemoverId === permuta.id}
                  disabled={ocupado}
                  onClick={() => void onRemover(permuta.id)}
                >
                  Remover
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      <EditorNavButton to="/editor">Voltar</EditorNavButton>
    </section>
  )
}
