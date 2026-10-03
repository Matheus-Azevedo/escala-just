import { gerarSemana } from './gerar'
import { inicioGeracaoFromModo } from './semana'
import type { Ausencia, Oficial, Permuta, SemanaEscala } from './types'

export function semanaOrigemContinuacao(
  semanas: SemanaEscala[],
  idsComCelulas: ReadonlySet<string>,
  dataInicioNova: string,
): SemanaEscala | undefined {
  return semanas
    .filter((semana) => semana.dataInicio < dataInicioNova && idsComCelulas.has(semana.id))
    .sort((a, b) => b.dataInicio.localeCompare(a.dataInicio))[0]
}

export function ancorasContinuacao(entrada: {
  origem: SemanaEscala
  oficiais: Oficial[]
  ausencias: Ausencia[]
  permutas: Permuta[]
}): { ancoraTitular: number; ancoraSuplente: number } {
  const resultado = gerarSemana({
    semana: entrada.origem,
    oficiais: entrada.oficiais,
    ausencias: entrada.ausencias,
    permutas: entrada.permutas,
    inicio: inicioGeracaoFromModo(entrada.origem.modoRotacao),
  })
  return {
    ancoraTitular: resultado.proximaAncoraTitular,
    ancoraSuplente: resultado.proximaAncoraSuplente,
  }
}
