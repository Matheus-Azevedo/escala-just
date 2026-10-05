import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { EditorNavButton } from '@/components/editor-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { useCelulasService } from '@/hooks/celulas-context'
import { useOficiaisService } from '@/hooks/oficiais-context'
import { useSemanasService } from '@/hooks/semanas-context'
import {
  formatarDiaBr,
  meusDias,
  oficiaisPorNome,
  rotuloVaraTitular,
  semanasVisiveisNaLista,
  type CelulaGrade,
  type Oficial,
} from '@/lib/escala'

function rotuloPosto(celula: CelulaGrade): string {
  const base = celula.papel === 'titular' ? `Titular ${celula.posicao}` : `Suplente ${celula.posicao}`
  if (celula.papel !== 'titular') return base
  const vara = rotuloVaraTitular(celula.posicao)
  return vara ? `${base} — ${vara}` : base
}

export function LeitorDiasPage() {
  const semanasServico = useSemanasService()
  const celulasServico = useCelulasService()
  const oficiaisServico = useOficiaisService()
  const [oficiais, setOficiais] = useState<Oficial[]>([])
  const [celulas, setCelulas] = useState<CelulaGrade[]>([])
  const [termo, setTermo] = useState('')
  const [listaPronta, setListaPronta] = useState(false)
  const [mostrarEsqueleto, setMostrarEsqueleto] = useState(false)

  useEffect(() => {
    let cancelado = false
    const atraso = window.setTimeout(() => {
      if (!cancelado) setMostrarEsqueleto(true)
    }, 150)
    void Promise.all([semanasServico.listar(), oficiaisServico.listar()])
      .then(async ([lista, cadastro]) => {
        if (cancelado) return
        setOficiais(cadastro)
        const visiveis = semanasVisiveisNaLista(lista)
        const grupos = await Promise.all(visiveis.map((semana) => celulasServico.listarDaSemana(semana.id)))
        if (!cancelado) setCelulas(grupos.flat())
      })
      .catch((cause: unknown) => {
        if (!cancelado) {
          toast.error(cause instanceof Error ? cause.message : 'Não foi possível carregar os dias.')
        }
      })
      .finally(() => {
        window.clearTimeout(atraso)
        if (!cancelado) {
          setListaPronta(true)
          setMostrarEsqueleto(false)
        }
      })
    return () => {
      cancelado = true
      window.clearTimeout(atraso)
    }
  }, [celulasServico, oficiaisServico, semanasServico])

  const encontrados = oficiaisPorNome(oficiais, termo)

  return (
    <section className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <h2 className="text-xl font-semibold">Meus dias</h2>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="pesquisa-nome">Nome do oficial</Label>
        <Input
          id="pesquisa-nome"
          value={termo}
          placeholder="Escreva o nome"
          onChange={(event) => setTermo(event.target.value)}
        />
      </div>
      {!listaPronta && mostrarEsqueleto ? <Skeleton className="h-4 w-48" /> : null}
      {listaPronta && termo.trim() === '' ? (
        <p className="text-sm text-muted-foreground">Escreva um nome para ver os dias escalados.</p>
      ) : null}
      {listaPronta && termo.trim() !== '' && encontrados.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum oficial com esse nome.</p>
      ) : null}
      {listaPronta && encontrados.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {encontrados.map((oficial) => {
            const dias = meusDias(celulas, oficial.id)
            return (
              <li key={oficial.id} className="flex flex-col gap-2">
                <p className="text-sm font-medium">{oficial.nome}</p>
                {dias.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum dia escalado nas semanas à vista.</p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {dias.map((dia) => (
                      <li key={dia.id} className="rounded-md border px-3 py-2 text-sm">
                        <p className="font-medium">{formatarDiaBr(dia.data)}</p>
                        <p className="text-muted-foreground">{rotuloPosto(dia)}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            )
          })}
        </ul>
      ) : null}
      <EditorNavButton to="/leitor" className="w-full">
        Voltar
      </EditorNavButton>
    </section>
  )
}
