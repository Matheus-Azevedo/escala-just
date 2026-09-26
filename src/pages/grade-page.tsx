import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { useAusenciasService } from '@/hooks/ausencias-context'
import { useCelulasService } from '@/hooks/celulas-context'
import { useOficiaisService } from '@/hooks/oficiais-context'
import { usePermutasService } from '@/hooks/permutas-context'
import {
  diasUteisDaSemana,
  formatarDiaBr,
  type CelulaGrade,
  type Oficial,
  type SemanaEscala,
} from '@/lib/escala'

function nomeDoOficial(oficiais: Oficial[], id: string): string {
  if (!id) return '—'
  return oficiais.find((oficial) => oficial.id === id)?.nome ?? id
}

function celulaEm(
  celulas: CelulaGrade[],
  data: string,
  papel: 'titular' | 'suplente',
  posicao: number,
): CelulaGrade | undefined {
  return celulas.find(
    (item) => item.data === data && item.papel === papel && item.posicao === posicao,
  )
}

const LINHAS: { rotulo: string; papel: 'titular' | 'suplente'; posicao: number }[] = [
  { rotulo: 'Titular 1', papel: 'titular', posicao: 1 },
  { rotulo: 'Titular 2', papel: 'titular', posicao: 2 },
  { rotulo: 'Titular 3', papel: 'titular', posicao: 3 },
  { rotulo: 'Suplente 1', papel: 'suplente', posicao: 1 },
  { rotulo: 'Suplente 2', papel: 'suplente', posicao: 2 },
]

export function GradeSemana({ semana }: { semana: SemanaEscala }) {
  const oficiaisServico = useOficiaisService()
  const ausenciasServico = useAusenciasService()
  const permutasServico = usePermutasService()
  const celulasServico = useCelulasService()

  const [oficiais, setOficiais] = useState<Oficial[]>([])
  const [celulas, setCelulas] = useState<CelulaGrade[]>([])
  const [aGerar, setAGerar] = useState(false)

  useEffect(() => {
    let cancelado = false
    void Promise.all([
      oficiaisServico.listar(),
      celulasServico.listarDaSemana(semana.id),
    ])
      .then(([listaOficiais, listaCelulas]) => {
        if (cancelado) return
        setOficiais(listaOficiais)
        setCelulas(listaCelulas)
      })
      .catch((cause: unknown) => {
        if (!cancelado) {
          toast.error(cause instanceof Error ? cause.message : 'Não foi possível abrir a grade.')
        }
      })
    return () => {
      cancelado = true
    }
  }, [celulasServico, oficiaisServico, semana.id])

  const dias = useMemo(() => diasUteisDaSemana(semana), [semana])

  async function gerar() {
    setAGerar(true)
    try {
      const [listaOficiais, ausencias, permutas] = await Promise.all([
        oficiaisServico.listar(),
        ausenciasServico.listar(),
        permutasServico.listar(),
      ])
      const resultado = await celulasServico.gerar({
        semana,
        oficiais: listaOficiais,
        ausencias,
        permutas,
      })
      setOficiais(listaOficiais)
      setCelulas(resultado.celulas)
      if (resultado.avisos.length > 0) {
        toast.message(resultado.avisos.join(' '))
      } else {
        toast.success('Grade gerada.')
      }
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : 'Não foi possível gerar a grade.')
    } finally {
      setAGerar(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-lg font-semibold">Grade da semana</h3>
      <p className="text-sm text-muted-foreground">
        Três titulares e dois suplentes por dia.
        {semana.exibirHorarioPlantao ? ' Plantão normal: 7h às 13h.' : ''}
      </p>

      <Button type="button" pending={aGerar} disabled={aGerar} onClick={() => void gerar()}>
        {celulas.length > 0 ? 'Recalcular' : 'Gerar'}
      </Button>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[40rem] text-left text-sm">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="px-2 py-2 font-medium">Vaga</th>
              {dias.map((dia) => (
                <th key={dia} className="px-2 py-2 font-medium">
                  {formatarDiaBr(dia)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {LINHAS.map((linha) => (
              <tr key={`${linha.papel}-${linha.posicao}`} className="border-b last:border-0">
                <th className="px-2 py-2 font-medium">{linha.rotulo}</th>
                {dias.map((dia) => {
                  const celula = celulaEm(celulas, dia, linha.papel, linha.posicao)
                  return (
                    <td key={dia} className="px-2 py-2">
                      {nomeDoOficial(oficiais, celula?.oficialId ?? '')}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
