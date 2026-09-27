import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { EditorNavButton } from '@/components/editor-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { useSemanasService } from '@/hooks/semanas-context'
import { useVersoesService } from '@/hooks/versoes-context'
import {
  formatarInstanteBr,
  formatarIntervaloBr,
  rotuloOrigemVersao,
  type SemanaEscala,
  type VersaoEscala,
} from '@/lib/escala'

function rotuloSemana(semanas: SemanaEscala[], semanaId: string): string {
  const semana = semanas.find((item) => item.id === semanaId)
  if (!semana) return 'Semana removida'
  return formatarIntervaloBr(semana.dataInicio, semana.dataFim)
}

export function HistoricoPage() {
  const versoesServico = useVersoesService()
  const semanasServico = useSemanasService()
  const [versoes, setVersoes] = useState<VersaoEscala[]>([])
  const [semanas, setSemanas] = useState<SemanaEscala[]>([])
  const [listaPronta, setListaPronta] = useState(false)
  const [mostrarEsqueleto, setMostrarEsqueleto] = useState(false)

  useEffect(() => {
    let cancelado = false
    const atraso = window.setTimeout(() => {
      if (!cancelado) setMostrarEsqueleto(true)
    }, 150)
    void Promise.all([versoesServico.listar(), semanasServico.listar()])
      .then(([listaVersoes, listaSemanas]) => {
        if (cancelado) return
        setVersoes(listaVersoes)
        setSemanas(listaSemanas)
      })
      .catch((cause: unknown) => {
        if (!cancelado) {
          toast.error(cause instanceof Error ? cause.message : 'Não foi possível listar as versões.')
        }
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
    }
  }, [semanasServico, versoesServico])

  return (
    <section className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <h2 className="text-xl font-semibold">Histórico</h2>
      <p className="text-sm text-muted-foreground">
        Snapshots da grade após gerar ou recalcular.
      </p>
      <EditorNavButton to="/editor">Voltar</EditorNavButton>

      {!listaPronta && mostrarEsqueleto ? (
        <ul className="flex flex-col gap-2" aria-busy="true" aria-label="A carregar versões">
          {[0, 1].map((indice) => (
            <li key={indice} className="rounded-md border px-3 py-2">
              <Skeleton className="h-4 w-48" />
            </li>
          ))}
        </ul>
      ) : null}

      {listaPronta && versoes.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma versão guardada.</p>
      ) : null}

      {listaPronta && versoes.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {versoes.map((versao) => (
            <li
              key={versao.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2"
            >
              <div>
                <p className="font-medium">{rotuloSemana(semanas, versao.semanaId)}</p>
                <p className="text-xs text-muted-foreground">
                  {formatarInstanteBr(versao.criadoEm)} · {rotuloOrigemVersao(versao.origem)}
                </p>
              </div>
              <EditorNavButton to={`/editor/historico/${versao.id}`} size="sm">
                Abrir
              </EditorNavButton>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  )
}
