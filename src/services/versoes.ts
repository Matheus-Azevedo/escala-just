import { addDoc, collection, doc, getDoc, getDocs } from 'firebase/firestore'

import type { CelulaGrade, OrigemVersao, VersaoEscala } from '@/lib/escala'
import { isFirebaseConfigured } from '@/lib/firebase-config'

import { getFirebaseDb } from './firebase'

const COLECAO = 'versoes'

export type VersoesService = {
  listar: () => Promise<VersaoEscala[]>
  obter: (id: string) => Promise<VersaoEscala | null>
  guardar: (entrada: {
    semanaId: string
    origem: OrigemVersao
    celulas: CelulaGrade[]
    agora?: Date
  }) => Promise<VersaoEscala>
}

function lerCelula(data: Record<string, unknown>, indice: number): CelulaGrade {
  const papel = data.papel === 'suplente' ? 'suplente' : 'titular'
  const posicao = typeof data.posicao === 'number' ? data.posicao : Number(data.posicao)
  return {
    id: typeof data.id === 'string' ? data.id : `snap-${indice}`,
    semanaId: typeof data.semanaId === 'string' ? data.semanaId : '',
    data: typeof data.data === 'string' ? data.data : '',
    papel,
    posicao: Number.isInteger(posicao) ? posicao : 1,
    oficialId: typeof data.oficialId === 'string' ? data.oficialId : '',
  }
}

function lerVersao(id: string, data: Record<string, unknown>): VersaoEscala {
  const origem: OrigemVersao = data.origem === 'recalcular' ? 'recalcular' : 'gerar'
  const brutas = Array.isArray(data.celulas) ? data.celulas : []
  return {
    id,
    semanaId: typeof data.semanaId === 'string' ? data.semanaId : '',
    criadoEm: typeof data.criadoEm === 'string' ? data.criadoEm : '',
    origem,
    celulas: brutas.map((item, indice) =>
      lerCelula(item && typeof item === 'object' ? (item as Record<string, unknown>) : {}, indice),
    ),
  }
}

function ordenar(lista: VersaoEscala[]): VersaoEscala[] {
  return [...lista].sort((a, b) => b.criadoEm.localeCompare(a.criadoEm))
}

function campos(entrada: {
  semanaId: string
  origem: OrigemVersao
  celulas: CelulaGrade[]
  agora?: Date
}) {
  const criadoEm = (entrada.agora ?? new Date()).toISOString()
  return {
    semanaId: entrada.semanaId,
    criadoEm,
    origem: entrada.origem,
    celulas: entrada.celulas.map((celula) => ({
      id: celula.id,
      semanaId: celula.semanaId,
      data: celula.data,
      papel: celula.papel,
      posicao: celula.posicao,
      oficialId: celula.oficialId,
    })),
  }
}

export function createFirebaseVersoesService(): VersoesService {
  return {
    async listar() {
      if (!isFirebaseConfigured()) return []
      const snap = await getDocs(collection(getFirebaseDb(), COLECAO))
      return ordenar(snap.docs.map((documento) => lerVersao(documento.id, documento.data())))
    },
    async obter(id) {
      if (!isFirebaseConfigured()) return null
      const snap = await getDoc(doc(getFirebaseDb(), COLECAO, id))
      if (!snap.exists()) return null
      return lerVersao(snap.id, snap.data())
    },
    async guardar(entrada) {
      if (!isFirebaseConfigured()) {
        throw new Error('Firebase não configurado.')
      }
      const payload = campos(entrada)
      const ref = await addDoc(collection(getFirebaseDb(), COLECAO), payload)
      return lerVersao(ref.id, payload)
    },
  }
}

export function createMemoryVersoesService(iniciais: VersaoEscala[] = []): VersoesService {
  let itens = [...iniciais]
  let seq = iniciais.length

  return {
    async listar() {
      return ordenar(itens)
    },
    async obter(id) {
      return itens.find((item) => item.id === id) ?? null
    },
    async guardar(entrada) {
      seq += 1
      const payload = campos(entrada)
      const versao: VersaoEscala = { id: `ver-${seq}`, ...payload }
      itens = [...itens, versao]
      return versao
    },
  }
}
