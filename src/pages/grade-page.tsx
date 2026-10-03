import { useEffect, useMemo, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { editorNavHover } from '@/components/editor-menu'
import { Button } from '@/components/ui/button'
import { campoControloClass } from '@/components/ui/input'
import { useAusenciasService } from '@/hooks/ausencias-context'
import { useCelulasService } from '@/hooks/celulas-context'
import { useVersoesService } from '@/hooks/versoes-context'
import { useOficiaisService } from '@/hooks/oficiais-context'
import { usePermutasService } from '@/hooks/permutas-context'
import {
  diasUteisDaSemana,
  escalaParaCsv,
  escalaParaPdf,
  formatarDiaBr,
  formatarIntervaloBr,
  mensagemExportar,
  oficiaisElegiveisParaCelula,
  podeExportarEscala,
  rotuloVaraTitular,
  type Ausencia,
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

export function GradeSemana({
  semana,
  consulta = false,
  celulasFixas,
  onCelulasChange,
}: {
  semana: SemanaEscala
  consulta?: boolean
  celulasFixas?: CelulaGrade[]
  onCelulasChange?: (quantidade: number) => void
}) {
  const oficiaisServico = useOficiaisService()
  const ausenciasServico = useAusenciasService()
  const permutasServico = usePermutasService()
  const celulasServico = useCelulasService()
  const versoesServico = useVersoesService()

  const [oficiais, setOficiais] = useState<Oficial[]>([])
  const [ausencias, setAusencias] = useState<Ausencia[]>([])
  const [celulas, setCelulas] = useState<CelulaGrade[]>([])
  const [aGerar, setAGerar] = useState(false)
  const [aLimpar, setALimpar] = useState(false)
  const [aExportar, setAExportar] = useState<'csv' | 'pdf' | null>(null)
  const [ajustandoId, setAjustandoId] = useState<string | null>(null)

  useEffect(() => {
    let cancelado = false
    void Promise.all([
      oficiaisServico.listar(),
      ausenciasServico.listar(),
      celulasFixas ? Promise.resolve(celulasFixas) : celulasServico.listarDaSemana(semana.id),
    ])
      .then(([listaOficiais, listaAusencias, listaCelulas]) => {
        if (cancelado) return
        setOficiais(listaOficiais)
        setAusencias(listaAusencias)
        setCelulas(listaCelulas)
        onCelulasChange?.(listaCelulas.length)
      })
      .catch((cause: unknown) => {
        if (!cancelado) {
          toast.error(cause instanceof Error ? cause.message : 'Não foi possível abrir a grade.')
        }
      })
    return () => {
      cancelado = true
    }
  }, [ausenciasServico, celulasFixas, celulasServico, oficiaisServico, onCelulasChange, semana.id])

  const dias = useMemo(() => diasUteisDaSemana(semana), [semana])

  async function gerar() {
    setAGerar(true)
    try {
      const [listaOficiais, ausencias, permutas, existentes] = await Promise.all([
        oficiaisServico.listar(),
        ausenciasServico.listar(),
        permutasServico.listar(),
        celulasFixas ? Promise.resolve(celulasFixas) : celulasServico.listarDaSemana(semana.id),
      ])
      const origem = existentes.length > 0 ? 'recalcular' : 'gerar'
      const resultado = await celulasServico.gerar({
        semana,
        oficiais: listaOficiais,
        ausencias,
        permutas,
      })
      setOficiais(listaOficiais)
      setAusencias(ausencias)
      setCelulas(resultado.celulas)
      onCelulasChange?.(resultado.celulas.length)
      try {
        await versoesServico.guardar({
          semanaId: semana.id,
          origem,
          celulas: resultado.celulas,
        })
      } catch (causaVersao) {
        toast.error(
          causaVersao instanceof Error
            ? causaVersao.message
            : 'A grade foi gerada, mas não foi possível guardar a versão.',
        )
      }
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

  async function limpar() {
    if (celulasFixas || celulas.length === 0) return
    setALimpar(true)
    try {
      await celulasServico.limpar(semana.id)
      setCelulas([])
      onCelulasChange?.(0)
      toast.success('Grade limpa.')
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : 'Não foi possível limpar a grade.')
    } finally {
      setALimpar(false)
    }
  }

  async function ajustar(celula: CelulaGrade, oficialId: string) {
    if (oficialId === celula.oficialId) return
    setAjustandoId(celula.id)
    try {
      const actualizado = await celulasServico.ajustar({
        celulaId: celula.id,
        oficialId,
        oficiais,
        ausencias,
      })
      setCelulas((lista) =>
        lista.map((item) => (item.id === actualizado.id ? actualizado : item)),
      )
      toast.success('Célula actualizada.')
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : 'Não foi possível ajustar a célula.')
    } finally {
      setAjustandoId(null)
    }
  }

  function descarregar(nome: string, blob: Blob) {
    const url = URL.createObjectURL(blob)
    const ligacao = document.createElement('a')
    ligacao.href = url
    ligacao.download = nome
    ligacao.click()
    URL.revokeObjectURL(url)
  }

  function nomeFicheiro(extensao: 'csv' | 'pdf') {
    const intervalo = formatarIntervaloBr(semana.dataInicio, semana.dataFim).replaceAll('/', '-')
    return `escala-${intervalo}.${extensao}`
  }

  function exportar(formato: 'csv' | 'pdf') {
    const guarda = podeExportarEscala(celulas)
    if (!guarda.ok) {
      toast.error(mensagemExportar(guarda.erro))
      return
    }
    setAExportar(formato)
    try {
      if (formato === 'csv') {
        const csv = escalaParaCsv(semana, celulas, oficiais)
        descarregar(nomeFicheiro('csv'), new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }))
        toast.success('CSV descarregado.')
      } else {
        const buffer = escalaParaPdf(semana, celulas, oficiais)
        descarregar(
          nomeFicheiro('pdf'),
          new Blob([buffer], { type: 'application/pdf' }),
        )
        toast.success('PDF descarregado.')
      }
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : 'Não foi possível exportar.')
    } finally {
      setAExportar(null)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-lg font-semibold">Grade da semana</h3>
      <p className="text-sm text-muted-foreground">
        Três titulares e dois suplentes por dia.
        {semana.exibirHorarioPlantao ? ' Plantão normal: 7h às 13h.' : ''}
        {!consulta ? ' Recalcular substitui todos os ajustes manuais desta semana.' : ''}
      </p>

      {consulta && celulas.length === 0 ? (
        <p className="text-sm text-muted-foreground">Ainda não há grade nesta semana.</p>
      ) : null}

      <div className="flex flex-wrap gap-2 print:hidden">
        {!consulta ? (
          <>
            <Button
              type="button"
              pending={aGerar}
              disabled={aGerar || aLimpar}
              onClick={() => void gerar()}
            >
              {celulas.length > 0 ? 'Recalcular' : 'Gerar'}
            </Button>
            <Button
              type="button"
              variant="outline"
              className={editorNavHover}
              pending={aLimpar}
              disabled={aLimpar || aGerar || celulas.length === 0 || aExportar !== null}
              onClick={() => void limpar()}
            >
              Limpar
            </Button>
          </>
        ) : null}
        <Button
          type="button"
          variant="outline"
          className={editorNavHover}
          pending={aExportar === 'csv'}
          disabled={aExportar !== null}
          onClick={() => exportar('csv')}
        >
          Exportar CSV
        </Button>
        <Button
          type="button"
          variant="outline"
          className={editorNavHover}
          pending={aExportar === 'pdf'}
          disabled={aExportar !== null}
          onClick={() => exportar('pdf')}
        >
          Exportar PDF
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[40rem] text-left text-sm">
          <thead>
            <tr className="border-b">
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
              <tr
                key={`${linha.papel}-${linha.posicao}`}
                className={
                  linha.papel === 'suplente'
                    ? 'border-b text-muted-foreground last:border-0'
                    : 'border-b last:border-0'
                }
              >
                <th
                  className={
                    linha.papel === 'titular'
                      ? 'px-2 py-2 font-medium'
                      : 'px-2 py-2 font-normal'
                  }
                >
                  {linha.papel === 'titular'
                    ? `${linha.rotulo} — ${rotuloVaraTitular(linha.posicao)}`
                    : linha.rotulo}
                </th>
                {dias.map((dia) => {
                  const celula = celulaEm(celulas, dia, linha.papel, linha.posicao)
                  if (!celula || consulta) {
                    const nome = nomeDoOficial(oficiais, celula?.oficialId ?? '')
                    return (
                      <td
                        key={dia}
                        className={
                          nome === '—'
                            ? 'px-2 py-2 text-muted-foreground'
                            : 'px-2 py-2'
                        }
                      >
                        {nome}
                      </td>
                    )
                  }
                  const elegiveis = oficiaisElegiveisParaCelula({
                    celulas,
                    celula,
                    oficiais,
                    ausencias,
                  })
                  const aAjustar = ajustandoId === celula.id
                  return (
                    <td key={dia} className="px-2 py-2">
                      <div className="relative">
                        <select
                          className={`${campoControloClass} min-w-[7rem] px-1${aAjustar ? ' text-transparent' : ''}`}
                          aria-label={`${linha.rotulo} em ${formatarDiaBr(dia)}`}
                          aria-busy={aAjustar || undefined}
                          value={celula.oficialId}
                          disabled={aAjustar}
                          onChange={(evento) => void ajustar(celula, evento.target.value)}
                        >
                          <option value="">—</option>
                          {elegiveis.map((oficial) => (
                            <option key={oficial.id} value={oficial.id}>
                              {oficial.nome}
                            </option>
                          ))}
                        </select>
                        {aAjustar ? (
                          <Loader2
                            className="pointer-events-none absolute top-1/2 left-1/2 size-4 -translate-x-1/2 -translate-y-1/2 animate-spin"
                            aria-hidden
                          />
                        ) : null}
                      </div>
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
