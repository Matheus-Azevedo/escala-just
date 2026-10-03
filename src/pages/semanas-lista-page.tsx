import { type FormEvent, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import { toast } from 'sonner'

import { CampoData } from '@/components/campo-data'
import { EditorNavButton } from '@/components/editor-menu'
import { EscolhaModoRotacao } from '@/components/escolha-modo-rotacao'
import { FormularioPeriodo } from '@/components/formulario-periodo'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { useAusenciasService } from '@/hooks/ausencias-context'
import { useCelulasService } from '@/hooks/celulas-context'
import { useOficiaisService } from '@/hooks/oficiais-context'
import { usePermutasService } from '@/hooks/permutas-context'
import { useSemanasService } from '@/hooks/semanas-context'
import {
  agruparSemanasPorMes,
  ancorasContinuacao,
  formatarIntervaloBr,
  modoRotacaoPadraoCriacao,
  recortarSemana,
  rotuloModoRotacao,
  semanaOrigemContinuacao,
  semanasVisiveisNaLista,
  type ModoRotacao,
  type SemanaEscala,
} from '@/lib/escala'
import type { CelulasService } from '@/services/celulas'
import { SemanasValidacaoError } from '@/services/semanas'

async function idsGeradas(
  lista: SemanaEscala[],
  celulasServico: CelulasService,
): Promise<Set<string>> {
  const ids = await Promise.all(
    lista.map(async (semana) => {
      const celulas = await celulasServico.listarDaSemana(semana.id)
      return celulas.length > 0 ? semana.id : null
    }),
  )
  return new Set(ids.filter((id): id is string => id !== null))
}

function mensagemErro(cause: unknown): string {
  if (cause instanceof SemanasValidacaoError) return cause.message
  if (cause instanceof Error && cause.message) return cause.message
  return 'Não foi possível gravar a semana.'
}

function rotuloIntervalo(semana: SemanaEscala): string {
  return formatarIntervaloBr(semana.dataInicio, semana.dataFim)
}

export function SemanasListaPage() {
  const [params, setParams] = useSearchParams()
  const aba = params.get('aba') === 'periodo' ? 'periodo' : 'semana'
  const servico = useSemanasService()
  const oficiaisServico = useOficiaisService()
  const ausenciasServico = useAusenciasService()
  const permutasServico = usePermutasService()
  const celulasServico = useCelulasService()
  const [semanas, setSemanas] = useState<SemanaEscala[]>([])
  const [idsComCelulas, setIdsComCelulas] = useState<Set<string>>(new Set())
  const [dataEscolhida, setDataEscolhida] = useState('')
  const [continuar, setContinuar] = useState(false)
  const [modoRotacao, setModoRotacao] = useState<ModoRotacao>(modoRotacaoPadraoCriacao())
  const [aGravar, setAGravar] = useState(false)
  const [aRemoverId, setARemoverId] = useState<string | null>(null)
  const [listaPronta, setListaPronta] = useState(false)
  const [mostrarEsqueleto, setMostrarEsqueleto] = useState(false)

  async function recarregar() {
    const lista = await servico.listar()
    setSemanas(lista)
    setIdsComCelulas(await idsGeradas(lista, celulasServico))
  }

  useEffect(() => {
    let cancelado = false
    const atraso = window.setTimeout(() => {
      if (!cancelado) setMostrarEsqueleto(true)
    }, 150)
    void servico
      .listar()
      .then(async (lista) => {
        if (cancelado) return
        setSemanas(lista)
        setIdsComCelulas(await idsGeradas(lista, celulasServico))
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
  }, [servico, celulasServico])

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setAGravar(true)
    try {
      const recorte = recortarSemana(dataEscolhida)
      let ancoraTitular = 1
      let ancoraSuplente = 1
      let modo = modoRotacao
      if (continuar && recorte) {
        const origem = semanaOrigemContinuacao(semanas, idsComCelulas, recorte.dataInicio)
        if (!origem) {
          toast.error('Não há semana gerada anterior.')
          return
        }
        const [oficiais, ausencias, permutas] = await Promise.all([
          oficiaisServico.listar(),
          ausenciasServico.listar(),
          permutasServico.listar(),
        ])
        const ancoras = ancorasContinuacao({
          origem,
          oficiais,
          ausencias,
          permutas,
        })
        ancoraTitular = ancoras.ancoraTitular
        ancoraSuplente = ancoras.ancoraSuplente
        modo = origem.modoRotacao
      }
      await servico.criar({ dataEscolhida, ancoraTitular, ancoraSuplente, modoRotacao: modo })
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

  const grupos = agruparSemanasPorMes(semanasVisiveisNaLista(semanas))
  const ocupado = aGravar || aRemoverId !== null

  return (
    <section className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <h2 className="text-xl font-semibold">Semanas</h2>
      <p className="text-sm text-muted-foreground">
        Crie uma semana ou um período; a lista abaixo junta tudo, por mês.
      </p>

      <div className="flex gap-2 border-b" role="tablist" aria-label="Criar">
        <button
          type="button"
          role="tab"
          aria-selected={aba === 'semana'}
          className={`px-2 py-1.5 text-sm ${aba === 'semana' ? 'border-b-2 border-primary font-medium' : 'text-muted-foreground'}`}
          onClick={() => setParams({}, { replace: true })}
        >
          Semana
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={aba === 'periodo'}
          className={`px-2 py-1.5 text-sm ${aba === 'periodo' ? 'border-b-2 border-primary font-medium' : 'text-muted-foreground'}`}
          onClick={() => setParams({ aba: 'periodo' }, { replace: true })}
        >
          Período
        </button>
      </div>

      {aba === 'semana' ? (
      <form className="flex flex-col gap-3 rounded-lg border p-3" onSubmit={onSubmit}>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="semana-data">Data de referência</Label>
          <CampoData id="semana-data" value={dataEscolhida} onChange={setDataEscolhida} />
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="semana-continuar"
            checked={continuar}
            disabled={idsComCelulas.size === 0}
            onCheckedChange={(value) => setContinuar(value === true)}
          />
          <Label htmlFor="semana-continuar">Continuar da semana anterior</Label>
        </div>
        {continuar ? (
          <p className="text-sm text-muted-foreground">
            A ordem da rotação será a mesma da semana anterior.
          </p>
        ) : (
          <EscolhaModoRotacao
            idPrefix="semana-criar"
            value={modoRotacao}
            onChange={setModoRotacao}
          />
        )}
        <Button type="submit" pending={aGravar} disabled={ocupado || !dataEscolhida}>
          Criar semana
        </Button>
      </form>
      ) : (
        <FormularioPeriodo
          temGerada={idsComCelulas.size > 0}
          disabled={ocupado}
          onConcluido={recarregar}
        />
      )}

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

      {listaPronta && grupos.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma semana criada.</p>
      ) : null}

      {listaPronta && grupos.length > 0 ? (
        <div className="flex flex-col gap-4">
          {grupos.map((grupo) => (
            <section key={grupo.rotulo} className="flex flex-col gap-2">
              <h3 className="text-sm font-semibold text-muted-foreground">{grupo.rotulo}</h3>
              <ul className="flex flex-col gap-2">
                {grupo.semanas.map((semana) => (
                  <li
                    key={semana.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2"
                  >
                    <div>
                      <p className="font-medium">{rotuloIntervalo(semana)}</p>
                      <p className="text-xs text-muted-foreground">
                        {rotuloModoRotacao(semana.modoRotacao)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <EditorNavButton size="sm" to={`/editor/semanas/${semana.id}`}>
                        Detalhes
                      </EditorNavButton>
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
            </section>
          ))}
        </div>
      ) : null}

      <EditorNavButton to="/editor">Voltar</EditorNavButton>
    </section>
  )
}
