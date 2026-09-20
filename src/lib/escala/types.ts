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

export const TETO_ROTACAO = 24

export function isPapel(value: unknown): value is Papel {
  return value === 'editor' || value === 'leitor'
}
