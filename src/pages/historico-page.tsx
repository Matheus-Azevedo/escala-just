import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { AjudaFuncao } from '@/components/ajuda-funcao'
import { EditorNavButton } from '@/components/editor-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { useSemanasService } from '@/hooks/semanas-context'
import {
  agruparSemanasPorMes,
  formatarIntervaloBr,
  semanasPassadas,
  type SemanaEscala,
} from '@/lib/escala'

export function HistoricoPage() {
  const semanasServico = useSemanasService()
  const [semanas, setSemanas] = useState<SemanaEscala[]>([])
  const [listaPronta, setListaPronta] = useState(false)
  const [mostrarEsqueleto, setMostrarEsqueleto] = useState(false)

  useEffect(() => {
    let cancelado = false
    const atraso = window.setTimeout(() => {
      if (!cancelado) setMostrarEsqueleto(true)
    }, 150)
    void semanasServico
      .listar()
      .then((listaSemanas) => {
        if (cancelado) return
        setSemanas(semanasPassadas(listaSemanas))
      })
      .catch((cause: unknown) => {
        if (!cancelado) {
          toast.error(cause instanceof Error ? cause.message : 'Não foi possível listar o histórico.')
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
      window.clearTimeout(atraso)
    }
  }, [semanasServico])

  const grupos = agruparSemanasPorMes(semanas)

  return (
    <section className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <div className="flex items-center gap-1">
        <h2 className="text-xl font-semibold">Histórico</h2>
        <AjudaFuncao texto="Lista semanas cuja sexta já passou; daqui não se edita a grade." />
      </div>
      <p className="text-sm text-muted-foreground">
        Escalas cuja sexta já terminou. Só leitura.
      </p>
      <EditorNavButton to="/editor">Voltar</EditorNavButton>

      {!listaPronta && mostrarEsqueleto ? (
        <ul className="flex flex-col gap-2" aria-busy="true" aria-label="A carregar histórico">
          {[0, 1].map((indice) => (
            <li key={indice} className="rounded-md border px-3 py-2">
              <Skeleton className="h-4 w-48" />
            </li>
          ))}
        </ul>
      ) : null}

      {listaPronta && semanas.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma escala passada.</p>
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
                    <p className="font-medium">
                      {formatarIntervaloBr(semana.dataInicio, semana.dataFim)}
                    </p>
                    <EditorNavButton to={`/editor/historico/${semana.id}`} size="sm">
                      Abrir
                    </EditorNavButton>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      ) : null}
    </section>
  )
}
