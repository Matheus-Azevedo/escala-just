import { useEffect, useState } from 'react'
import { useParams } from 'react-router'
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
import { GradeSemana } from '@/pages/grade-page'

export function HistoricoVersaoPage() {
  const { id } = useParams<{ id: string }>()
  const versoesServico = useVersoesService()
  const semanasServico = useSemanasService()
  const [versao, setVersao] = useState<VersaoEscala | null>(null)
  const [semana, setSemana] = useState<SemanaEscala | null>(null)
  const [pronta, setPronta] = useState(false)

  useEffect(() => {
    if (!id) return
    let cancelado = false
    void versoesServico
      .obter(id)
      .then(async (encontrada) => {
        if (cancelado) return
        setVersao(encontrada)
        if (!encontrada) return
        const lista = await semanasServico.listar()
        if (cancelado) return
        setSemana(lista.find((item) => item.id === encontrada.semanaId) ?? null)
      })
      .catch((cause: unknown) => {
        if (!cancelado) {
          toast.error(cause instanceof Error ? cause.message : 'Não foi possível abrir a versão.')
        }
      })
      .finally(() => {
        if (!cancelado) setPronta(true)
      })
    return () => {
      cancelado = true
    }
  }, [id, semanasServico, versoesServico])

  const semanaVista: SemanaEscala | null =
    semana ??
    (versao
      ? {
          id: versao.semanaId,
          dataInicio: versao.celulas[0]?.data ?? '',
          dataFim: versao.celulas[versao.celulas.length - 1]?.data ?? '',
          estado: 'rascunho',
          feriados: [],
          exibirHorarioPlantao: false,
          ancoraTitular: 1,
          ancoraSuplente: 1,
        }
      : null)

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-4">
      <h2 className="text-xl font-semibold">Versão da escala</h2>
      <EditorNavButton to="/editor/historico">Voltar</EditorNavButton>

      {!id || (pronta && !versao) ? (
        <p className="text-sm text-muted-foreground">Versão não encontrada.</p>
      ) : null}

      {id && !pronta ? <Skeleton className="h-8 w-64" /> : null}

      {pronta && versao && semanaVista ? (
        <>
          <p className="text-sm text-muted-foreground">
            {semana
              ? formatarIntervaloBr(semana.dataInicio, semana.dataFim)
              : 'Semana removida'}
            {' · '}
            {formatarInstanteBr(versao.criadoEm)} · {rotuloOrigemVersao(versao.origem)}
            . Só leitura.
          </p>
          <GradeSemana semana={semanaVista} consulta celulasFixas={versao.celulas} />
        </>
      ) : null}
    </section>
  )
}
