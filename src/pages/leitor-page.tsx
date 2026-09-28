import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { EditorNavButton } from '@/components/editor-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { useSemanasService } from '@/hooks/semanas-context'
import {
  agruparSemanasPorMes,
  formatarIntervaloBr,
  semanasVisiveisNaLista,
  type SemanaEscala,
} from '@/lib/escala'

export function LeitorPage() {
  const servico = useSemanasService()
  const [semanas, setSemanas] = useState<SemanaEscala[]>([])
  const [listaPronta, setListaPronta] = useState(false)
  const [mostrarEsqueleto, setMostrarEsqueleto] = useState(false)

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
        if (!cancelado) {
          toast.error(cause instanceof Error ? cause.message : 'Não foi possível listar as semanas.')
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
  }, [servico])

  const grupos = agruparSemanasPorMes(semanasVisiveisNaLista(semanas))

  return (
    <section className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <h2 className="text-xl font-semibold">Consulta da escala</h2>
      <p className="text-sm text-muted-foreground print:hidden">
        Titulares e suplentes por dia. Só leitura.
      </p>

      {!listaPronta && mostrarEsqueleto ? (
        <ul className="flex flex-col gap-2" aria-busy="true" aria-label="A carregar semanas">
          {[0, 1].map((indice) => (
            <li key={indice} className="rounded-md border px-3 py-2">
              <Skeleton className="h-4 w-40" />
            </li>
          ))}
        </ul>
      ) : null}

      {listaPronta && grupos.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma semana para consultar.</p>
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
                    <span className="print:hidden">
                      <EditorNavButton size="sm" to={`/leitor/semanas/${semana.id}`}>
                        Consultar
                      </EditorNavButton>
                    </span>
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
