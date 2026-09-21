import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  updateDoc,
} from 'firebase/firestore'

import {
  mensagemOficial,
  ordenarPorNome,
  proximasOrdens,
  validarEscritaOficial,
  type Oficial,
  type OficialDraft,
} from '@/lib/escala'
import { isFirebaseConfigured } from '@/lib/firebase-config'

import { getFirebaseDb } from './firebase'

const COLECAO = 'oficiais'

export class OficiaisValidacaoError extends Error {
  readonly codigo: 'nome-vazio' | 'nome-duplicado' | 'teto-24'

  constructor(codigo: 'nome-vazio' | 'nome-duplicado' | 'teto-24') {
    super(mensagemOficial(codigo))
    this.name = 'OficiaisValidacaoError'
    this.codigo = codigo
  }
}

export type OficiaisService = {
  listar: () => Promise<Oficial[]>
  criar: (draft: OficialDraft) => Promise<Oficial>
  atualizar: (id: string, draft: OficialDraft) => Promise<Oficial>
  remover: (id: string) => Promise<void>
  ordenarAlfabetico: () => Promise<Oficial[]>
}

function lerOficial(id: string, data: Record<string, unknown>): Oficial {
  return {
    id,
    nome: typeof data.nome === 'string' ? data.nome : '',
    foraDaRotacao: Boolean(data.foraDaRotacao),
    ordemTitular: Number(data.ordemTitular) || 0,
    ordemSuplente: Number(data.ordemSuplente) || 0,
  }
}

function payload(oficial: Omit<Oficial, 'id'>) {
  return {
    nome: oficial.nome,
    foraDaRotacao: oficial.foraDaRotacao,
    ordemTitular: oficial.ordemTitular,
    ordemSuplente: oficial.ordemSuplente,
  }
}

function aplicarDraft(
  lista: Oficial[],
  draft: OficialDraft,
  atual?: Oficial,
) {
  const validacao = validarEscritaOficial(lista, draft, atual?.id)
  if (!validacao.ok) {
    throw new OficiaisValidacaoError(validacao.erro)
  }
  const ordens = proximasOrdens(lista)
  return {
    nome: validacao.nome,
    foraDaRotacao: draft.foraDaRotacao ?? atual?.foraDaRotacao ?? false,
    ordemTitular: draft.ordemTitular ?? atual?.ordemTitular ?? ordens.ordemTitular,
    ordemSuplente: draft.ordemSuplente ?? atual?.ordemSuplente ?? ordens.ordemSuplente,
  }
}

export function createFirebaseOficiaisService(): OficiaisService {
  return {
    async listar() {
      if (!isFirebaseConfigured()) return []
      const snap = await getDocs(collection(getFirebaseDb(), COLECAO))
      return snap.docs.map((documento) => lerOficial(documento.id, documento.data()))
    },
    async criar(draft) {
      const lista = await this.listar()
      const campos = aplicarDraft(lista, draft)
      const ref = await addDoc(collection(getFirebaseDb(), COLECAO), payload(campos))
      return { id: ref.id, ...campos }
    },
    async atualizar(id, draft) {
      const lista = await this.listar()
      const atual = lista.find((oficial) => oficial.id === id)
      if (!atual) {
        throw new Error('Oficial não encontrado.')
      }
      const campos = aplicarDraft(lista, draft, atual)
      await updateDoc(doc(getFirebaseDb(), COLECAO, id), payload(campos))
      return { id, ...campos }
    },
    async remover(id) {
      await deleteDoc(doc(getFirebaseDb(), COLECAO, id))
    },
    async ordenarAlfabetico() {
      const ordenados = ordenarPorNome(await this.listar())
      await Promise.all(
        ordenados.map((oficial) =>
          updateDoc(doc(getFirebaseDb(), COLECAO, oficial.id), {
            ordemTitular: oficial.ordemTitular,
            ordemSuplente: oficial.ordemSuplente,
          }),
        ),
      )
      return ordenados
    },
  }
}

export function createMemoryOficiaisService(iniciais: Oficial[] = []): OficiaisService {
  let itens = [...iniciais]

  return {
    async listar() {
      return [...itens]
    },
    async criar(draft) {
      const campos = aplicarDraft(itens, draft)
      const oficial = { id: `mem-${itens.length + 1}`, ...campos }
      itens = [...itens, oficial]
      return oficial
    },
    async atualizar(id, draft) {
      const atual = itens.find((oficial) => oficial.id === id)
      if (!atual) {
        throw new Error('Oficial não encontrado.')
      }
      const campos = aplicarDraft(itens, draft, atual)
      const oficial = { id, ...campos }
      itens = itens.map((item) => (item.id === id ? oficial : item))
      return oficial
    },
    async remover(id) {
      itens = itens.filter((oficial) => oficial.id !== id)
    },
    async ordenarAlfabetico() {
      itens = ordenarPorNome(itens)
      return [...itens]
    },
  }
}