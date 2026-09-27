import { conflitoTitularSuplenteNoDia, diasUteisDaSemana } from './gerar'
import { formatarDiaBr } from './semana'
import type { CelulaGrade, Oficial, SemanaEscala } from './types'

const VAGAS: { rotulo: string; papel: 'titular' | 'suplente'; posicao: number }[] = [
  { rotulo: 'Titular 1', papel: 'titular', posicao: 1 },
  { rotulo: 'Titular 2', papel: 'titular', posicao: 2 },
  { rotulo: 'Titular 3', papel: 'titular', posicao: 3 },
  { rotulo: 'Suplente 1', papel: 'suplente', posicao: 1 },
  { rotulo: 'Suplente 2', papel: 'suplente', posicao: 2 },
]

export type ExportarErro = 'vazia' | 'rn-006'

export function mensagemExportar(erro: ExportarErro): string {
  if (erro === 'vazia') return 'Ainda não há grade para exportar.'
  return 'O mesmo oficial não pode ser titular e suplente no mesmo dia. Corrija a grade antes de exportar.'
}

export function podeExportarEscala(celulas: CelulaGrade[]):
  | { ok: true }
  | { ok: false; erro: ExportarErro } {
  if (celulas.length === 0) return { ok: false, erro: 'vazia' }
  const dias = [...new Set(celulas.map((item) => item.data))]
  if (dias.some((dia) => conflitoTitularSuplenteNoDia(celulas, dia))) {
    return { ok: false, erro: 'rn-006' }
  }
  return { ok: true }
}

function campoCsv(valor: string): string {
  if (/[;"\n]/.test(valor)) return `"${valor.replaceAll('"', '""')}"`
  return valor
}

function nomeDoOficial(oficiais: Oficial[], id: string): string {
  if (!id) return ''
  return oficiais.find((oficial) => oficial.id === id)?.nome ?? id
}

export function escalaParaCsv(
  semana: SemanaEscala,
  celulas: CelulaGrade[],
  oficiais: Oficial[],
): string {
  const dias = diasUteisDaSemana(semana)
  const linhas = ['Dia;Vaga;Oficial']
  for (const dia of dias) {
    for (const vaga of VAGAS) {
      const celula = celulas.find(
        (item) =>
          item.data === dia && item.papel === vaga.papel && item.posicao === vaga.posicao,
      )
      linhas.push(
        [
          campoCsv(formatarDiaBr(dia)),
          campoCsv(vaga.rotulo),
          campoCsv(nomeDoOficial(oficiais, celula?.oficialId ?? '')),
        ].join(';'),
      )
    }
  }
  return `${linhas.join('\n')}\n`
}
