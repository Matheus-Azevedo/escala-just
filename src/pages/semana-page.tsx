import { type FormEvent, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'

import { CampoData } from '@/components/campo-data'
import { EditorNavButton } from '@/components/editor-menu'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { useSemanasService } from '@/hooks/semanas-context'
import { formatarDiaBr, formatarIntervaloBr, type SemanaEscala } from '@/lib/escala'
import { SemanasValidacaoError } from '@/services/semanas'

function mensagemErro(cause: unknown): string {
  if (cause instanceof SemanasValidacaoError) return cause.message
  if (cause instanceof Error && cause.message) return cause.message
  return 'Não foi possível gravar os parâmetros.'
}

export function SemanaPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const servico = useSemanasService()
  const [semana, setSemana] = useState<SemanaEscala | null>(null)
  const [pronta, setPronta] = useState(false)
  const [mostrarEsqueleto, setMostrarEsqueleto] = useState(false)
  const [feriados, setFeriados] = useState<string[]>([])
  const [novoFeriado, setNovoFeriado] = useState('')
  const [ancoraTitular, setAncoraTitular] = useState('1')
  const [ancoraSuplente, setAncoraSuplente] = useState('1')
  const [exibirHorario, setExibirHorario] = useState(true)
  const [aGravar, setAGravar] = useState(false)

  useEffect(() => {
    if (!id) {
      navigate('/editor/semanas', { replace: true })
      return
    }
    let cancelado = false
    const atraso = window.setTimeout(() => {
      if (!cancelado) setMostrarEsqueleto(true)
    }, 150)
    void servico
      .obter(id)
      .then((encontrada) => {
        if (cancelado) return
        if (!encontrada) {
          toast.error('Semana não encontrada.')
          navigate('/editor/semanas', { replace: true })
          return
        }
        setSemana(encontrada)
        setFeriados(encontrada.feriados)
        setAncoraTitular(String(encontrada.ancoraTitular))
        setAncoraSuplente(String(encontrada.ancoraSuplente))
        setExibirHorario(encontrada.exibirHorarioPlantao)
      })
      .catch((cause: unknown) => {
        if (!cancelado) toast.error(mensagemErro(cause))
      })
      .finally(() => {
        window.clearTimeout(atraso)
        if (!cancelado) {
          setPronta(true)
          setMostrarEsqueleto(false)
        }
      })
    return () => {
      cancelado = true
      window.clearTimeout(atraso)
    }
  }, [id, navigate, servico])

  function acrescentarFeriado() {
    if (!novoFeriado) return
    setFeriados((atuais) =>
      atuais.includes(novoFeriado) ? atuais : [...atuais, novoFeriado].sort(),
    )
    setNovoFeriado('')
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!id) return
    setAGravar(true)
    try {
      const gravada = await servico.atualizar(id, {
        feriados,
        exibirHorarioPlantao: exibirHorario,
        ancoraTitular: Number(ancoraTitular),
        ancoraSuplente: Number(ancoraSuplente),
      })
      setSemana(gravada)
      setFeriados(gravada.feriados)
      toast.success('Parâmetros guardados.')
    } catch (cause) {
      toast.error(mensagemErro(cause))
    } finally {
      setAGravar(false)
    }
  }

  if (!pronta && mostrarEsqueleto) {
    return (
      <section className="mx-auto flex w-full max-w-2xl flex-col gap-3" aria-busy="true">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-24 w-full" />
      </section>
    )
  }

  if (!semana) {
    return null
  }

  return (
    <section className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <h2 className="text-xl font-semibold">Parâmetros da semana</h2>
      <p className="text-sm text-muted-foreground">
        T-05: {formatarIntervaloBr(semana.dataInicio, semana.dataFim)}. Feriados só para
        exibição.
        Sem gerar a grade.
      </p>

      <form className="flex flex-col gap-3 rounded-lg border p-3" onSubmit={onSubmit}>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="semana-feriado">Feriado local</Label>
          <div className="flex flex-wrap gap-2">
            <CampoData id="semana-feriado" value={novoFeriado} onChange={setNovoFeriado} />
            <Button type="button" variant="outline" onClick={acrescentarFeriado}>
              Acrescentar
            </Button>
          </div>
        </div>
        {feriados.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {feriados.map((feriado) => (
              <li key={feriado} className="flex items-center justify-between gap-2 text-sm">
                <span>{formatarDiaBr(feriado)} (exibição)</span>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    setFeriados((atuais) => atuais.filter((item) => item !== feriado))
                  }
                >
                  Tirar
                </Button>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="semana-ancora-titular">Âncora dos titulares</Label>
          <Input
            id="semana-ancora-titular"
            type="number"
            min={1}
            step={1}
            value={ancoraTitular}
            onChange={(event) => setAncoraTitular(event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="semana-ancora-suplente">Âncora dos suplentes</Label>
          <Input
            id="semana-ancora-suplente"
            type="number"
            min={1}
            step={1}
            value={ancoraSuplente}
            onChange={(event) => setAncoraSuplente(event.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="semana-horario"
            checked={exibirHorario}
            onCheckedChange={(value) => setExibirHorario(value === true)}
          />
          <Label htmlFor="semana-horario">
            {exibirHorario ? 'Mostrar 7h às 13h' : 'Não mostrar 7h às 13h'}
          </Label>
        </div>
        {exibirHorario ? (
          <p className="text-sm text-muted-foreground">Plantão normal: 7h às 13h</p>
        ) : null}
        <Button type="submit" pending={aGravar} disabled={aGravar}>
          Guardar
        </Button>
      </form>

      <EditorNavButton to="/editor/semanas">Voltar às semanas</EditorNavButton>
    </section>
  )
}
