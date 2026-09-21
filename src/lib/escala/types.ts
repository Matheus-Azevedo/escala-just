export type Papel = 'editor' | 'leitor'

export type Oficial = {
  id: string
  nome: string
  foraDaRotacao: boolean
  ordemTitular: number
  ordemSuplente: number
}

export type OficialDraft = {
  nome: string
  foraDaRotacao?: boolean
  ordemTitular?: number
  ordemSuplente?: number
}

export type OficialErro = 'nome-vazio' | 'nome-duplicado' | 'teto-24'

export type EstadoSemana = 'rascunho' | 'validada' | 'arquivada'

export type SemanaEscala = {
  id: string
  dataInicio: string
  dataFim: string
  estado: EstadoSemana
  feriados: string[]
  exibirHorarioPlantao: boolean
  ancoraTitular: number
  ancoraSuplente: number
}

export type SemanaDraft = {
  dataEscolhida?: string
  dataInicio?: string
  dataFim?: string
  feriados?: string[]
  exibirHorarioPlantao?: boolean
  ancoraTitular?: number
  ancoraSuplente?: number
}

export type SemanaErro =
  | 'intervalo-invalido'
  | 'segunda-duplicada'
  | 'feriado-fora'
  | 'ancora-invalida'

export const TETO_ROTACAO = 24

export function isPapel(value: unknown): value is Papel {
  return value === 'editor' || value === 'leitor'
}
