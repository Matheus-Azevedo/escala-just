import {
  TETO_ROTACAO,
  type Oficial,
  type OficialDraft,
  type OficialErro,
} from './types'

export function normalizarNome(nome: string): string {
  return nome.trim()
}

export function nomeValido(nome: string): boolean {
  return normalizarNome(nome).length > 0
}

export function nomeDuplicado(
  nome: string,
  existentes: Oficial[],
  exceptId?: string,
): boolean {
  const chave = normalizarNome(nome).toLocaleLowerCase('pt-BR')
  return existentes.some(
    (oficial) =>
      oficial.id !== exceptId &&
      normalizarNome(oficial.nome).toLocaleLowerCase('pt-BR') === chave,
  )
}

export function podeIncluirNaRotacao(
  oficiais: Oficial[],
  candidato: { foraDaRotacao: boolean; id?: string },
): boolean {
  if (candidato.foraDaRotacao) return true
  const ativos = oficiais.filter(
    (oficial) => !oficial.foraDaRotacao && oficial.id !== candidato.id,
  )
  return ativos.length < TETO_ROTACAO
}

export function proximasOrdens(oficiais: Oficial[]): {
  ordemTitular: number
  ordemSuplente: number
} {
  const ordemTitular =
    oficiais.reduce((max, oficial) => Math.max(max, oficial.ordemTitular), 0) + 1
  const ordemSuplente =
    oficiais.reduce((max, oficial) => Math.max(max, oficial.ordemSuplente), 0) + 1
  return { ordemTitular, ordemSuplente }
}

export function ordenarPorNome(oficiais: Oficial[]): Oficial[] {
  return [...oficiais]
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
    .map((oficial, indice) => ({
      ...oficial,
      ordemTitular: indice + 1,
      ordemSuplente: indice + 1,
    }))
}

export function mensagemOficial(erro: OficialErro): string {
  if (erro === 'nome-vazio') return 'Informe o nome do oficial.'
  if (erro === 'nome-duplicado') return 'Já existe um oficial com este nome.'
  return 'A rotação admite no máximo 24 oficiais.'
}

export function validarEscritaOficial(
  lista: Oficial[],
  draft: OficialDraft,
  exceptId?: string,
): { ok: true; nome: string } | { ok: false; erro: OficialErro } {
  const nome = normalizarNome(draft.nome)
  if (!nomeValido(nome)) return { ok: false, erro: 'nome-vazio' }
  if (nomeDuplicado(nome, lista, exceptId)) return { ok: false, erro: 'nome-duplicado' }
  const foraDaRotacao = draft.foraDaRotacao ?? false
  if (!podeIncluirNaRotacao(lista, { foraDaRotacao, id: exceptId })) {
    return { ok: false, erro: 'teto-24' }
  }
  return { ok: true, nome }
}