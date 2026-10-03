import { jsPDF } from 'jspdf'

import { conflitoTitularSuplenteNoDia, diasUteisDaSemana } from './gerar'
import { formatarDiaBr, formatarIntervaloBr } from './semana'
import { rotuloVaraTitular } from './varas'
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

function rotuloVaga(vaga: (typeof VAGAS)[number]): string {
  if (vaga.papel === 'titular') {
    const vara = rotuloVaraTitular(vaga.posicao)
    return vara ? `${vaga.rotulo} — ${vara}` : vaga.rotulo
  }
  return vaga.rotulo
}

function nomeNaCelula(
  celulas: CelulaGrade[],
  oficiais: Oficial[],
  dia: string,
  vaga: (typeof VAGAS)[number],
): string {
  const celula = celulas.find(
    (item) => item.data === dia && item.papel === vaga.papel && item.posicao === vaga.posicao,
  )
  return nomeDoOficial(oficiais, celula?.oficialId ?? '')
}

export function escalaParaCsv(
  semana: SemanaEscala,
  celulas: CelulaGrade[],
  oficiais: Oficial[],
): string {
  const dias = diasUteisDaSemana(semana)
  const cabecalho = ['Vaga', ...dias.map((dia) => formatarDiaBr(dia))].map(campoCsv).join(';')
  const linhas = [cabecalho]
  for (const vaga of VAGAS) {
    linhas.push(
      [rotuloVaga(vaga), ...dias.map((dia) => nomeNaCelula(celulas, oficiais, dia, vaga))]
        .map(campoCsv)
        .join(';'),
    )
  }
  return `${linhas.join('\n')}\n`
}

export function escalaParaPdf(
  semana: SemanaEscala,
  celulas: CelulaGrade[],
  oficiais: Oficial[],
): Uint8Array {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4', compress: false })
  const dias = diasUteisDaSemana(semana)
  const margem = 10
  const largura = 297 - margem * 2
  const colunaVaga = 78
  const colunaDia = (largura - colunaVaga) / Math.max(dias.length, 1)
  const linhas = VAGAS.map((vaga) => [
    rotuloVaga(vaga),
    ...dias.map((dia) => nomeNaCelula(celulas, oficiais, dia, vaga) || '—'),
  ])
  const cabecalho = ['Vaga', ...dias.map((dia) => formatarDiaBr(dia))]

  doc.setFontSize(12)
  doc.text(`Escala ${formatarIntervaloBr(semana.dataInicio, semana.dataFim)}`, margem, 12)

  let y = 18
  const desenharLinha = (celulasLinha: string[], negrito: boolean) => {
    doc.setFont('helvetica', negrito ? 'bold' : 'normal')
    doc.setFontSize(8)
    const alturas = celulasLinha.map((texto, indice) => {
      const larguraColuna = indice === 0 ? colunaVaga : colunaDia
      return doc.splitTextToSize(texto, larguraColuna - 3).length
    })
    const altura = Math.max(...alturas) * 4 + 4
    let x = margem
    celulasLinha.forEach((texto, indice) => {
      const larguraColuna = indice === 0 ? colunaVaga : colunaDia
      doc.rect(x, y, larguraColuna, altura)
      const partes = doc.splitTextToSize(texto, larguraColuna - 3) as string[]
      doc.text(partes, x + 1.5, y + 4.5)
      x += larguraColuna
    })
    y += altura
  }

  desenharLinha(cabecalho, true)
  for (const linha of linhas) desenharLinha(linha, false)
  return new Uint8Array(doc.output('arraybuffer'))
}
