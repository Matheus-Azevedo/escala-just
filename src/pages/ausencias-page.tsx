import { type FormEvent, useEffect, useState } from 'react'
import { toast } from 'sonner'

import { CampoData } from '@/components/campo-data'
import { editorNavHover, EditorNavButton } from '@/components/editor-menu'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { useAusenciasService } from '@/hooks/ausencias-context'
import { useOficiaisService } from '@/hooks/oficiais-context'
import { formatarIntervaloBr, type Ausencia, type Oficial, type TipoAusencia } from '@/lib/escala'
import { AusenciasValidacaoError } from '@/services/ausencias'

const TIPOS: { valor: TipoAusencia; rotulo: string }[] = [
  { valor: 'ferias', rotulo: 'Férias' },
  { valor: 'doenca', rotulo: 'Doença' },
  { valor: 'outro', rotulo: 'Outro' },
]

function rotuloTipo(tipo: TipoAusencia): string {
  return TIPOS.find((item) => item.valor === tipo)?.rotulo ?? tipo
}

function mensagemErro(cause: unknown): string {
  if (cause instanceof AusenciasValidacaoError) return cause.message
  if (cause instanceof Error && cause.message) return cause.message
  return 'Não foi possível gravar a ausência.'
}

export function AusenciasPage() {
  const servico = useAusenciasService()
  const oficiaisServico = useOficiaisService()
  const [ausencias, setAusencias] = useState<Ausencia[]>([])
  const [oficiais, setOficiais] = useState<Oficial[]>([])
  const [oficialId, setOficialId] = useState('')
  const [tipo, setTipo] = useState<TipoAusencia>('ferias')
  const [motivo, setMotivo] = useState('')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [aGravar, setAGravar] = useState(false)
  const [aRemoverId, setARemoverId] = useState<string | null>(null)
  const [listaPronta, setListaPronta] = useState(false)
  const [mostrarEsqueleto, setMostrarEsqueleto] = useState(false)

  function limparFormulario() {
    setEditandoId(null)
    setOficialId('')
    setTipo('ferias')
    setMotivo('')
    setDataInicio('')
    setDataFim('')
  }

  async function recarregar() {
    setAusencias(await servico.listar())
  }

  useEffect(() => {
    let cancelado = false
    const atraso = window.setTimeout(() => {
      if (!cancelado) setMostrarEsqueleto(true)
    }, 150)
    void Promise.all([servico.listar(), oficiaisServico.listar()])
      .then(([lista, gente]) => {
        if (!cancelado) {
          setAusencias(lista)
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
      const draft = { oficialId, tipo, dataInicio, dataFim, motivo }
      if (editandoId) {
        await servico.atualizar(editandoId, draft)
        toast.success('Ausência actualizada.')
      } else {
        await servico.criar(draft)
        toast.success('Ausência criada.')
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
      toast.success('Ausência removida.')
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
      <h2 className="text-xl font-semibold">Ausências</h2>
      <p className="text-sm text-muted-foreground">
        T-06: férias, doença ou outro. A geração da grade usa estes períodos
        noutra change.
      </p>

      <form className="flex flex-col gap-3 rounded-lg border p-3" onSubmit={onSubmit}>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ausencia-oficial">Oficial</Label>
          <select
            id="ausencia-oficial"
            className="h-8 rounded-lg border border-border bg-background px-2.5 text-sm"
            value={oficialId}
            onChange={(event) => setOficialId(event.target.value)}
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
          <Label htmlFor="ausencia-tipo">Tipo</Label>
          <select
            id="ausencia-tipo"
            className="h-8 rounded-lg border border-border bg-background px-2.5 text-sm"
            value={tipo}
            onChange={(event) => {
              const seguinte = event.target.value as TipoAusencia
              setTipo(seguinte)
              if (seguinte !== 'outro') setMotivo('')
            }}
          >
            {TIPOS.map((item) => (
              <option key={item.valor} value={item.valor}>
                {item.rotulo}
              </option>
            ))}
          </select>
        </div>
        {tipo === 'outro' ? (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ausencia-motivo">Motivo (opcional)</Label>
            <Input
              id="ausencia-motivo"
              value={motivo}
              maxLength={120}
              placeholder="Ex.: formação, licença…"
              onChange={(event) => setMotivo(event.target.value)}
            />
          </div>
        ) : null}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ausencia-inicio">Início</Label>
          <CampoData
            key={`inicio-${editandoId ?? 'novo'}`}
            id="ausencia-inicio"
            value={dataInicio}
            onChange={setDataInicio}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ausencia-fim">Fim</Label>
          <CampoData
            key={`fim-${editandoId ?? 'novo'}`}
            id="ausencia-fim"
            value={dataFim}
            onChange={setDataFim}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="submit"
            pending={aGravar}
            disabled={ocupado || !oficialId || !dataInicio || !dataFim}
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
        <ul className="flex flex-col gap-2" aria-busy="true" aria-label="A carregar ausências">
          {[0, 1].map((indice) => (
            <li key={indice} className="flex flex-col gap-2 rounded-md border px-3 py-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-28" />
            </li>
          ))}
        </ul>
      ) : null}

      {listaPronta && ausencias.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma ausência registada.</p>
      ) : null}

      {listaPronta && ausencias.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {ausencias.map((ausencia) => (
            <li
              key={ausencia.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2"
            >
              <div>
                <p className="font-medium">{nomeOficial(ausencia.oficialId)}</p>
                <p className="text-xs text-muted-foreground">
                  {rotuloTipo(ausencia.tipo)}
                  {ausencia.motivo ? ` — ${ausencia.motivo}` : ''} ·{' '}
                  {formatarIntervaloBr(ausencia.dataInicio, ausencia.dataFim)}
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
                    setEditandoId(ausencia.id)
                    setOficialId(ausencia.oficialId)
                    setTipo(ausencia.tipo)
                    setMotivo(ausencia.motivo ?? '')
                    setDataInicio(ausencia.dataInicio)
                    setDataFim(ausencia.dataFim)
                  }}
                >
                  Editar
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  pending={aRemoverId === ausencia.id}
                  disabled={ocupado}
                  onClick={() => void onRemover(ausencia.id)}
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
