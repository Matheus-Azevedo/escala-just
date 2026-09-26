import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  updateDoc,
} from 'firebase/firestore'

import {
  isTipoAusencia,
  mensagemAusencia,
  motivoAusencia,
  validarEscritaAusencia,
  type Ausencia,
  type AusenciaDraft,
  type AusenciaErro,
  type TipoAusencia,
} from '@/lib/escala'
import { isFirebaseConfigured } from '@/lib/firebase-config'

import { getFirebaseDb } from './firebase'

const COLECAO = 'ausencias'

export class AusenciasValidacaoError extends Error {
  readonly codigo: AusenciaErro

  constructor(codigo: AusenciaErro) {
    super(mensagemAusencia(codigo))
    this.name = 'AusenciasValidacaoError'
    this.codigo = codigo
  }
}

export type AusenciasService = {
  listar: () => Promise<Ausencia[]>
  criar: (draft: AusenciaDraft) => Promise<Ausencia>
  atualizar: (id: string, draft: AusenciaDraft) => Promise<Ausencia>
  remover: (id: string) => Promise<void>
}

function lerTipo(valor: unknown): TipoAusencia {
  return isTipoAusencia(valor) ? valor : 'outro'
}

function lerAusencia(id: string, data: Record<string, unknown>): Ausencia {
  const tipo = lerTipo(data.tipo)
  const motivoLido = typeof data.motivo === 'string' ? data.motivo : undefined
  return {
    id,
    oficialId: typeof data.oficialId === 'string' ? data.oficialId : '',
    tipo,
    dataInicio: typeof data.dataInicio === 'string' ? data.dataInicio : '',
    dataFim: typeof data.dataFim === 'string' ? data.dataFim : '',
    motivo: motivoAusencia(tipo, motivoLido),
  }
}

function aplicarDraft(draft: AusenciaDraft) {
  const validacao = validarEscritaAusencia(draft)
  if (!validacao.ok) {
    throw new AusenciasValidacaoError(validacao.erro)
  }
  const motivo = motivoAusencia(draft.tipo, draft.motivo)
  return {
    oficialId: draft.oficialId,
    tipo: draft.tipo,
    dataInicio: draft.dataInicio,
    dataFim: draft.dataFim,
    motivo: motivo ?? '',
  }
}

export function createFirebaseAusenciasService(): AusenciasService {
  return {
    async listar() {
      if (!isFirebaseConfigured()) return []
      const snap = await getDocs(collection(getFirebaseDb(), COLECAO))
      return snap.docs.map((documento) => lerAusencia(documento.id, documento.data()))
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

export function createMemoryAusenciasService(iniciais: Ausencia[] = []): AusenciasService {
  let itens = [...iniciais]

  return {
    async listar() {
      return [...itens]
    },
    async criar(draft) {
      const campos = aplicarDraft(draft)
      const ausencia = { id: `aus-${itens.length + 1}`, ...campos }
      itens = [...itens, ausencia]
      return ausencia
    },
    async atualizar(id, draft) {
      if (!itens.some((item) => item.id === id)) {
        throw new Error('Ausência não encontrada.')
      }
      const campos = aplicarDraft(draft)
      const ausencia = { id, ...campos }
      itens = itens.map((item) => (item.id === id ? ausencia : item))
      return ausencia
    },
    async remover(id) {
      itens = itens.filter((item) => item.id !== id)
    },
  }
}
