import { useEffect, useState } from 'react'
import { useParams } from 'react-router'
import { toast } from 'sonner'

import { EditorNavButton } from '@/components/editor-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { useSemanasService } from '@/hooks/semanas-context'
import { formatarIntervaloBr, semanaPassada, type SemanaEscala } from '@/lib/escala'
import { GradeSemana } from '@/pages/grade-page'

export function HistoricoVersaoPage() {
  const { id } = useParams<{ id: string }>()
  const semanasServico = useSemanasService()
  const [semana, setSemana] = useState<SemanaEscala | null>(null)
  const [pronta, setPronta] = useState(false)

  useEffect(() => {
    if (!id) return
    let cancelado = false
    void semanasServico
      .listar()
      .then((lista) => {
        if (cancelado) return
        const encontrada = lista.find((item) => item.id === id) ?? null
        setSemana(encontrada && semanaPassada(encontrada) ? encontrada : null)
      })
      .catch((cause: unknown) => {
        if (!cancelado) {
          toast.error(cause instanceof Error ? cause.message : 'Não foi possível abrir a escala.')
        }
      })
      .finally(() => {
        if (!cancelado) setPronta(true)
      })
    return () => {
      cancelado = true
    }
  }, [id, semanasServico])

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-4">
      <h2 className="text-xl font-semibold">Escala passada</h2>
      <EditorNavButton to="/editor/historico">Voltar</EditorNavButton>

      {!id || (pronta && !semana) ? (
        <p className="text-sm text-muted-foreground">Escala não encontrada no histórico.</p>
      ) : null}

      {id && !pronta ? <Skeleton className="h-8 w-64" /> : null}

      {pronta && semana ? (
        <>
          <p className="text-sm text-muted-foreground">
            {formatarIntervaloBr(semana.dataInicio, semana.dataFim)}. Só leitura.
          </p>
          <GradeSemana semana={semana} consulta />
        </>
      ) : null}
    </section>
  )
}
