import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  updateDoc,
} from 'firebase/firestore'

import {
  isPapelPermuta,
  mensagemPermuta,
  observacaoPermuta,
  validarEscritaPermuta,
  type PapelPermuta,
  type Permuta,
  type PermutaDraft,
  type PermutaErro,
} from '@/lib/escala'
import { isFirebaseConfigured } from '@/lib/firebase-config'

import { getFirebaseDb } from './firebase'

const COLECAO = 'permutas'

export class PermutasValidacaoError extends Error {
  readonly codigo: PermutaErro

  constructor(codigo: PermutaErro) {
    super(mensagemPermuta(codigo))
    this.name = 'PermutasValidacaoError'
    this.codigo = codigo
  }
}

export type PermutasService = {
  listar: () => Promise<Permuta[]>
  criar: (draft: PermutaDraft) => Promise<Permuta>
  atualizar: (id: string, draft: PermutaDraft) => Promise<Permuta>
  remover: (id: string) => Promise<void>
}

function lerPapel(valor: unknown): PapelPermuta {
  return isPapelPermuta(valor) ? valor : 'titular'
}

function lerPermuta(id: string, data: Record<string, unknown>): Permuta {
  const observacaoLida = typeof data.observacao === 'string' ? data.observacao : undefined
  return {
    id,
    afetadoId: typeof data.afetadoId === 'string' ? data.afetadoId : '',
    substitutoId: typeof data.substitutoId === 'string' ? data.substitutoId : '',
    papel: lerPapel(data.papel),
    dataInicio: typeof data.dataInicio === 'string' ? data.dataInicio : '',
    dataFim: typeof data.dataFim === 'string' ? data.dataFim : '',
    observacao: observacaoPermuta(observacaoLida),
  }
}

function aplicarDraft(draft: PermutaDraft) {
  const validacao = validarEscritaPermuta(draft)
  if (!validacao.ok) {
    throw new PermutasValidacaoError(validacao.erro)
  }
  return {
    afetadoId: draft.afetadoId,
    substitutoId: draft.substitutoId,
    papel: draft.papel,
    dataInicio: draft.dataInicio,
    dataFim: draft.dataFim,
    observacao: observacaoPermuta(draft.observacao) ?? '',
  }
}

export function createFirebasePermutasService(): PermutasService {
  return {
    async listar() {
      if (!isFirebaseConfigured()) return []
      const snap = await getDocs(collection(getFirebaseDb(), COLECAO))
      return snap.docs.map((documento) => lerPermuta(documento.id, documento.data()))
    },
    async criar(draft) {
      const campos = aplicarDraft(draft)
      const ref = await addDoc(collection(getFirebaseDb(), COLECAO), campos)
      return { id: ref.id, ...campos }
    },
    async atualizar(id, draft) {
      const campos = aplicarDraft(draft)
      await updateDoc(doc(getFirebaseDb(), COLECAO, id), campos)
      return { id, ...campos }
    },
    async remover(id) {
      await deleteDoc(doc(getFirebaseDb(), COLECAO, id))
    },
  }
}

export function createMemoryPermutasService(iniciais: Permuta[] = []): PermutasService {
  let itens = [...iniciais]

  return {
    async listar() {
      return [...itens]
    },
    async criar(draft) {
      const campos = aplicarDraft(draft)
      const permuta = { id: `per-${itens.length + 1}`, ...campos }
      itens = [...itens, permuta]
      return permuta
    },
    async atualizar(id, draft) {
      if (!itens.some((item) => item.id === id)) {
        throw new Error('Permuta não encontrada.')
      }
      const campos = aplicarDraft(draft)
      const permuta = { id, ...campos }
      itens = itens.map((item) => (item.id === id ? permuta : item))
      return permuta
    },
    async remover(id) {
      itens = itens.filter((item) => item.id !== id)
    },
  }
}
