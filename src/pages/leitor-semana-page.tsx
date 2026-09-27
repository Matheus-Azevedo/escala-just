import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'

import { EditorNavButton } from '@/components/editor-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { useSemanasService } from '@/hooks/semanas-context'
import { formatarIntervaloBr, type SemanaEscala } from '@/lib/escala'
import { GradeSemana } from '@/pages/grade-page'

export function LeitorSemanaPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const servico = useSemanasService()
  const [semana, setSemana] = useState<SemanaEscala | null>(null)
  const [pronta, setPronta] = useState(false)
  const [mostrarEsqueleto, setMostrarEsqueleto] = useState(false)

  useEffect(() => {
    if (!id) {
      navigate('/leitor', { replace: true })
      return
    }
    let cancelado = false
    const atraso = window.setTimeout(() => {
      if (!cancelado) setMostrarEsqueleto(true)
    }, 150)
    void servico
      .obter(id)
      .then((encontrada) => {
        if (cancelado) return
        if (!encontrada) {
          toast.error('Semana não encontrada.')
          navigate('/leitor', { replace: true })
          return
        }
        setSemana(encontrada)
      })
      .catch((cause: unknown) => {
        if (!cancelado) {
          toast.error(cause instanceof Error ? cause.message : 'Não foi possível abrir a semana.')
        }
      })
      .finally(() => {
        window.clearTimeout(atraso)
        if (!cancelado) {
          setPronta(true)
          setMostrarEsqueleto(false)
        }
      })
    return () => {
      cancelado = true
      window.clearTimeout(atraso)
    }
  }, [id, navigate, servico])

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-4">
      <h2 className="text-xl font-semibold">Consulta da escala</h2>
      {!pronta && mostrarEsqueleto ? <Skeleton className="h-8 w-56" /> : null}
      {semana ? (
        <>
          <p className="text-sm text-muted-foreground">
            {formatarIntervaloBr(semana.dataInicio, semana.dataFim)}
          </p>
          <GradeSemana semana={semana} consulta />
        </>
      ) : null}
      <span className="print:hidden w-fit">
        <EditorNavButton to="/leitor">Voltar</EditorNavButton>
      </span>
    </section>
  )
}
