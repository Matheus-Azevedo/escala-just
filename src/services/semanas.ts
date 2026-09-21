import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  updateDoc,
} from 'firebase/firestore'

import {
  mensagemSemana,
  validarEscritaSemana,
  type EstadoSemana,
  type SemanaDraft,
  type SemanaEscala,
  type SemanaErro,
} from '@/lib/escala'
import { isFirebaseConfigured } from '@/lib/firebase-config'

import { getFirebaseDb } from './firebase'

const COLECAO = 'semanas'

export class SemanasValidacaoError extends Error {
  readonly codigo: SemanaErro

  constructor(codigo: SemanaErro) {
    super(mensagemSemana(codigo))
    this.name = 'SemanasValidacaoError'
    this.codigo = codigo
  }
}

export type SemanasService = {
  listar: () => Promise<SemanaEscala[]>
  obter: (id: string) => Promise<SemanaEscala | null>
  criar: (draft: SemanaDraft) => Promise<SemanaEscala>
  atualizar: (id: string, draft: SemanaDraft) => Promise<SemanaEscala>
  remover: (id: string) => Promise<void>
}

function lerEstado(valor: unknown): EstadoSemana {
  if (valor === 'validada' || valor === 'arquivada' || valor === 'rascunho') {
    return valor
  }
  return 'rascunho'
}

function lerSemana(id: string, data: Record<string, unknown>): SemanaEscala {
  const feriados = Array.isArray(data.feriados)
    ? data.feriados.filter((item): item is string => typeof item === 'string')
    : []
  return {
    id,
    dataInicio: typeof data.dataInicio === 'string' ? data.dataInicio : '',
    dataFim: typeof data.dataFim === 'string' ? data.dataFim : '',
    estado: lerEstado(data.estado),
    feriados,
    exibirHorarioPlantao: data.exibirHorarioPlantao !== false,
    ancoraTitular: Number(data.ancoraTitular) || 1,
    ancoraSuplente: Number(data.ancoraSuplente) || 1,
  }
}

function payload(semana: Omit<SemanaEscala, 'id'>) {
  return {
    dataInicio: semana.dataInicio,
    dataFim: semana.dataFim,
    estado: semana.estado,
    feriados: semana.feriados,
    exibirHorarioPlantao: semana.exibirHorarioPlantao,
    ancoraTitular: semana.ancoraTitular,
    ancoraSuplente: semana.ancoraSuplente,
  }
}

function aplicarDraft(
  lista: SemanaEscala[],
  draft: SemanaDraft,
  atual?: SemanaEscala,
) {
  const validacao = validarEscritaSemana(lista, draft, atual)
  if (!validacao.ok) {
    throw new SemanasValidacaoError(validacao.erro)
  }
  return {
    dataInicio: validacao.dataInicio,
    dataFim: validacao.dataFim,
    estado: atual?.estado ?? ('rascunho' as const),
    feriados: validacao.feriados,
    exibirHorarioPlantao: validacao.exibirHorarioPlantao,
    ancoraTitular: validacao.ancoraTitular,
    ancoraSuplente: validacao.ancoraSuplente,
  }
}

export function createFirebaseSemanasService(): SemanasService {
  return {
    async listar() {
      if (!isFirebaseConfigured()) return []
      const snap = await getDocs(collection(getFirebaseDb(), COLECAO))
      return snap.docs.map((documento) => lerSemana(documento.id, documento.data()))
    },
    async obter(id) {
      if (!isFirebaseConfigured()) return null
      const snap = await getDoc(doc(getFirebaseDb(), COLECAO, id))
      if (!snap.exists()) return null
      return lerSemana(snap.id, snap.data())
    },
    async criar(draft) {
      const lista = await this.listar()
      const campos = aplicarDraft(lista, draft)
      const ref = await addDoc(collection(getFirebaseDb(), COLECAO), payload(campos))
      return { id: ref.id, ...campos }
    },
    async atualizar(id, draft) {
      const lista = await this.listar()
      const atual = lista.find((semana) => semana.id === id)
      if (!atual) {
        throw new Error('Semana não encontrada.')
      }
      const campos = aplicarDraft(lista, draft, atual)
      await updateDoc(doc(getFirebaseDb(), COLECAO, id), payload(campos))
      return { id, ...campos }
    },
    async remover(id) {
      await deleteDoc(doc(getFirebaseDb(), COLECAO, id))
    },
  }
}

export function createMemorySemanasService(
  iniciais: SemanaEscala[] = [],
): SemanasService {
  let itens = [...iniciais]

  return {
    async listar() {
      return [...itens]
    },
    async obter(id) {
      return itens.find((semana) => semana.id === id) ?? null
    },
    async criar(draft) {
      const campos = aplicarDraft(itens, draft)
      const semana = { id: `sem-${itens.length + 1}`, ...campos }
      itens = [...itens, semana]
      return semana
    },
    async atualizar(id, draft) {
      const atual = itens.find((semana) => semana.id === id)
      if (!atual) {
        throw new Error('Semana não encontrada.')
      }
      const campos = aplicarDraft(itens, draft, atual)
      const semana = { id, ...campos }
      itens = itens.map((item) => (item.id === id ? semana : item))
      return semana
    },
    async remover(id) {
      itens = itens.filter((semana) => semana.id !== id)
    },
  }
}
