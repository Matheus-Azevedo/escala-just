import { type FormEvent, useState } from 'react'
import { toast } from 'sonner'

import { EscolhaModoRotacao } from '@/components/escolha-modo-rotacao'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { campoControloClass } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAusenciasService } from '@/hooks/ausencias-context'
import { useCelulasService } from '@/hooks/celulas-context'
import { useOficiaisService } from '@/hooks/oficiais-context'
import { usePermutasService } from '@/hooks/permutas-context'
import { useSemanasService } from '@/hooks/semanas-context'
import { useVersoesService } from '@/hooks/versoes-context'
import {
  ancorasContinuacao,
  semanaOrigemContinuacao,
  modoRotacaoPadraoCriacao,
  semanasDoPeriodo,
  type ModoRotacao,
  type RecortePeriodo,
  type SemanaEscala,
} from '@/lib/escala'
import { SemanasValidacaoError } from '@/services/semanas'

function mensagemErro(cause: unknown): string {
  if (cause instanceof SemanasValidacaoError) return cause.message
  if (cause instanceof Error && cause.message) return cause.message
  return 'Não foi possível concluir o período.'
}

function recorteActual(tipo: 'mes' | 'ano', ano: number, mes: number): RecortePeriodo {
  return tipo === 'mes' ? { tipo: 'mes', ano, mes } : { tipo: 'ano', ano }
}

export function FormularioPeriodo({
  temGerada,
  disabled,
  onConcluido,
}: {
  temGerada: boolean
  disabled?: boolean
  onConcluido: () => Promise<void>
}) {
  const semanasServico = useSemanasService()
  const oficiaisServico = useOficiaisService()
  const ausenciasServico = useAusenciasService()
  const permutasServico = usePermutasService()
  const celulasServico = useCelulasService()
  const versoesServico = useVersoesService()
  const [tipo, setTipo] = useState<'mes' | 'ano'>('mes')
  const [ano, setAno] = useState(2026)
  const [mes, setMes] = useState(9)
  const [continuar, setContinuar] = useState(false)
  const [modoRotacao, setModoRotacao] = useState<ModoRotacao>(modoRotacaoPadraoCriacao())
  const [aCriar, setACriar] = useState(false)
  const [aGerar, setAGerar] = useState(false)

  async function idsComCelulas(lista: SemanaEscala[]): Promise<Set<string>> {
    const ids = await Promise.all(
      lista.map(async (semana) => {
        const celulas = await celulasServico.listarDaSemana(semana.id)
        return celulas.length > 0 ? semana.id : null
      }),
    )
    return new Set(ids.filter((id): id is string => id !== null))
  }

  async function garantirCascas(): Promise<SemanaEscala[]> {
    const recorte = recorteActual(tipo, ano, mes)
    const alvo = semanasDoPeriodo(recorte)
    let lista = await semanasServico.listar()
    const existentes = new Set(lista.map((semana) => semana.dataInicio))
    for (const semana of alvo) {
      if (existentes.has(semana.dataInicio)) continue
      await semanasServico.criar({
        dataInicio: semana.dataInicio,
        dataFim: semana.dataFim,
        modoRotacao,
      })
    }
    lista = await semanasServico.listar()
    return alvo
      .map((item) => lista.find((semana) => semana.dataInicio === item.dataInicio))
      .filter((semana): semana is SemanaEscala => Boolean(semana))
  }

  async function onCriar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setACriar(true)
    try {
      const lote = await garantirCascas()
      await onConcluido()
      toast.success(
        lote.length === 1 ? '1 semana pronta no período.' : `${lote.length} semanas prontas no período.`,
      )
    } catch (cause) {
      toast.error(mensagemErro(cause))
    } finally {
      setACriar(false)
    }
  }

  async function onGerar() {
    setAGerar(true)
    try {
      const lote = await garantirCascas()
      const lista = await semanasServico.listar()
      const geradas = await idsComCelulas(lista)
      const [oficiais, ausencias, permutas] = await Promise.all([
        oficiaisServico.listar(),
        ausenciasServico.listar(),
        permutasServico.listar(),
      ])
      let vazias = 0
      for (const semana of lote) {
        if (geradas.has(semana.id)) continue
        let actual = semana
        if (continuar) {
          const origem = semanaOrigemContinuacao(lista, geradas, semana.dataInicio)
          if (origem) {
            const ancoras = ancorasContinuacao({
              origem,
              oficiais,
              ausencias,
              permutas,
            })
            actual = await semanasServico.atualizar(semana.id, {
              ...ancoras,
              modoRotacao: origem.modoRotacao,
            })
            lista.splice(
              lista.findIndex((item) => item.id === actual.id),
              1,
              actual,
            )
          }
        }
        const resultado = await celulasServico.gerar({
          semana: actual,
          oficiais,
          ausencias,
          permutas,
        })
        try {
          await versoesServico.guardar({
            semanaId: actual.id,
            origem: 'gerar',
            celulas: resultado.celulas,
          })
        } catch (causaVersao) {
          toast.error(
            causaVersao instanceof Error
              ? causaVersao.message
              : 'A grade foi gerada, mas não foi possível guardar a versão.',
          )
        }
        geradas.add(actual.id)
        vazias += 1
      }
      await onConcluido()
      toast.success(
        vazias === 0
          ? 'Nenhuma semana vazia para gerar.'
          : vazias === 1
            ? '1 semana gerada.'
            : `${vazias} semanas geradas.`,
      )
    } catch (cause) {
      toast.error(mensagemErro(cause))
    } finally {
      setAGerar(false)
    }
  }

  const ocupado = disabled || aCriar || aGerar

  return (
    <form className="flex flex-col gap-3 rounded-lg border p-3" onSubmit={onCriar}>
      <p className="text-sm text-muted-foreground">
        Escolha um mês ou um ano. Criar só abre as semanas. Gerar faz a primeira
        passagem nas que ainda estão vazias. O resultado é rascunho. Última hora:
        ajuste a célula. Recalcular remonta uma semana.
      </p>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="periodo-tipo">Recorte</Label>
        <select
          id="periodo-tipo"
          className={campoControloClass}
          value={tipo}
          onChange={(event) => setTipo(event.target.value === 'ano' ? 'ano' : 'mes')}
        >
          <option value="mes">Mês</option>
          <option value="ano">Ano</option>
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="periodo-ano">Ano</Label>
        <select
          id="periodo-ano"
          className={campoControloClass}
          value={ano}
          onChange={(event) => setAno(Number(event.target.value))}
        >
          {[2025, 2026, 2027, 2028].map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>
      {tipo === 'mes' ? (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="periodo-mes">Mês</Label>
          <select
            id="periodo-mes"
            className={campoControloClass}
            value={mes}
            onChange={(event) => setMes(Number(event.target.value))}
          >
            {[
              'Janeiro',
              'Fevereiro',
              'Março',
              'Abril',
              'Maio',
              'Junho',
              'Julho',
              'Agosto',
              'Setembro',
              'Outubro',
              'Novembro',
              'Dezembro',
            ].map((nome, indice) => (
              <option key={nome} value={indice + 1}>
                {nome}
              </option>
            ))}
          </select>
        </div>
      ) : null}
      <div className="flex items-center gap-2">
        <Checkbox
          id="periodo-continuar"
          checked={continuar}
          disabled={!temGerada}
          onCheckedChange={(value) => setContinuar(value === true)}
        />
        <Label htmlFor="periodo-continuar">Continuar da semana anterior</Label>
      </div>
      {continuar ? (
        <p className="text-sm text-muted-foreground">
          A ordem da rotação será a mesma da semana anterior.
        </p>
      ) : (
        <EscolhaModoRotacao
          idPrefix="periodo"
          value={modoRotacao}
          onChange={setModoRotacao}
        />
      )}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" pending={aCriar} disabled={ocupado}>
          Criar semanas
        </Button>
        <Button type="button" pending={aGerar} disabled={ocupado} onClick={() => void onGerar()}>
          Gerar período
        </Button>
      </div>
    </form>
  )
}
