import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from 'firebase/firestore'

import {
  gerarSemana,
  mensagemAjuste,
  validarAjusteCelula,
  type Ausencia,
  type CelulaGrade,
  type Oficial,
  type Permuta,
  type ResultadoGeracao,
  type SemanaEscala,
} from '@/lib/escala'
import { isFirebaseConfigured } from '@/lib/firebase-config'

import { getFirebaseDb } from './firebase'

const COLECAO = 'celulas'

export class CelulasValidacaoError extends Error {
  constructor(mensagem: string) {
    super(mensagem)
    this.name = 'CelulasValidacaoError'
  }
}

export type CelulasService = {
  listarDaSemana: (semanaId: string) => Promise<CelulaGrade[]>
  gerar: (entrada: {
    semana: SemanaEscala
    oficiais: Oficial[]
    ausencias: Ausencia[]
    permutas: Permuta[]
  }) => Promise<{ avisos: ResultadoGeracao['avisos']; celulas: CelulaGrade[] }>
  ajustar: (entrada: {
    celulaId: string
    oficialId: string
    oficiais: Oficial[]
    ausencias: Ausencia[]
  }) => Promise<CelulaGrade>
}

function lerCelula(id: string, data: Record<string, unknown>): CelulaGrade {
  const papel = data.papel === 'suplente' ? 'suplente' : 'titular'
  const posicao = typeof data.posicao === 'number' ? data.posicao : Number(data.posicao)
  return {
    id,
    semanaId: typeof data.semanaId === 'string' ? data.semanaId : '',
    data: typeof data.data === 'string' ? data.data : '',
    papel,
    posicao: Number.isInteger(posicao) ? posicao : 1,
    oficialId: typeof data.oficialId === 'string' ? data.oficialId : '',
  }
}

async function substituirFirebase(semanaId: string, geradas: ResultadoGeracao['celulas']) {
  const db = getFirebaseDb()
  const snap = await getDocs(
    query(collection(db, COLECAO), where('semanaId', '==', semanaId)),
  )
  await Promise.all(snap.docs.map((documento) => deleteDoc(documento.ref)))
  const gravadas: CelulaGrade[] = []
  for (const celula of geradas) {
    const campos = {
      semanaId: celula.semanaId,
      data: celula.data,
      papel: celula.papel,
      posicao: celula.posicao,
      oficialId: celula.oficialId,
    }
    const ref = await addDoc(collection(db, COLECAO), campos)
    gravadas.push({ id: ref.id, ...campos })
  }
  return gravadas
}

function aplicarValidacao(
  celulas: CelulaGrade[],
  entrada: {
    celulaId: string
    oficialId: string
    oficiais: Oficial[]
    ausencias: Ausencia[]
  },
) {
  const resultado = validarAjusteCelula({
    celulas,
    celulaId: entrada.celulaId,
    oficialId: entrada.oficialId,
    oficiais: entrada.oficiais,
    ausencias: entrada.ausencias,
  })
  if (!resultado.ok) {
    throw new CelulasValidacaoError(mensagemAjuste(resultado.erro))
  }
}

export function createFirebaseCelulasService(): CelulasService {
  return {
    async listarDaSemana(semanaId) {
      if (!isFirebaseConfigured()) return []
      const snap = await getDocs(
        query(collection(getFirebaseDb(), COLECAO), where('semanaId', '==', semanaId)),
      )
      return snap.docs.map((documento) => lerCelula(documento.id, documento.data()))
    },
    async gerar(entrada) {
      const resultado = gerarSemana(entrada)
      if (!isFirebaseConfigured()) {
        return {
          ...resultado,
          celulas: resultado.celulas.map((celula, indice) => ({
            id: `cel-${indice + 1}`,
            ...celula,
          })),
        }
      }
      const celulas = await substituirFirebase(entrada.semana.id, resultado.celulas)
      return { avisos: resultado.avisos, celulas }
    },
    async ajustar(entrada) {
      if (!isFirebaseConfigured()) {
        throw new Error('Firebase não configurado.')
      }
      const snap = await getDoc(doc(getFirebaseDb(), COLECAO, entrada.celulaId))
      if (!snap.exists()) {
        throw new CelulasValidacaoError(mensagemAjuste('celula-inexistente'))
      }
      const actual = lerCelula(snap.id, snap.data())
      const daSemana = await this.listarDaSemana(actual.semanaId)
      aplicarValidacao(daSemana, entrada)
      await updateDoc(snap.ref, { oficialId: entrada.oficialId })
      return { ...actual, oficialId: entrada.oficialId }
    },
  }
}

export function createMemoryCelulasService(iniciais: CelulaGrade[] = []): CelulasService {
  let itens = [...iniciais]
  let seq = iniciais.length

  return {
    async listarDaSemana(semanaId) {
      return itens.filter((item) => item.semanaId === semanaId)
    },
    async gerar(entrada) {
      const resultado = gerarSemana(entrada)
      itens = itens.filter((item) => item.semanaId !== entrada.semana.id)
      const celulas = resultado.celulas.map((celula) => {
        seq += 1
        return { id: `cel-${seq}`, ...celula }
      })
      itens = [...itens, ...celulas]
      return { avisos: resultado.avisos, celulas }
    },
    async ajustar(entrada) {
      aplicarValidacao(itens, entrada)
      const actual = itens.find((item) => item.id === entrada.celulaId)
      if (!actual) {
        throw new CelulasValidacaoError(mensagemAjuste('celula-inexistente'))
      }
      const actualizado = { ...actual, oficialId: entrada.oficialId }
      itens = itens.map((item) => (item.id === actual.id ? actualizado : item))
      return actualizado
    },
  }
}
