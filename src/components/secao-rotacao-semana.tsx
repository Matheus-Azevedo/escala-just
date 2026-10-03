import { EscolhaModoRotacao } from '@/components/escolha-modo-rotacao'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { rotuloModoRotacao, type ModoRotacao } from '@/lib/escala'

function CamposAncora({
  ancoraTitular,
  ancoraSuplente,
  onAncoraTitularChange,
  onAncoraSuplenteChange,
}: {
  ancoraTitular: string
  ancoraSuplente: string
  onAncoraTitularChange: (valor: string) => void
  onAncoraSuplenteChange: (valor: string) => void
}) {
  return (
    <>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="semana-ancora-titular">Âncora dos titulares</Label>
        <Input
          id="semana-ancora-titular"
          type="number"
          min={1}
          step={1}
          value={ancoraTitular}
          onChange={(event) => onAncoraTitularChange(event.target.value)}
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
          onChange={(event) => onAncoraSuplenteChange(event.target.value)}
        />
      </div>
    </>
  )
}

export function SecaoRotacaoSemana({
  modo,
  onModoChange,
  bloqueado,
  ancoraTitular,
  ancoraSuplente,
  onAncoraTitularChange,
  onAncoraSuplenteChange,
}: {
  modo: ModoRotacao
  onModoChange: (modo: ModoRotacao) => void
  bloqueado: boolean
  ancoraTitular: string
  ancoraSuplente: string
  onAncoraTitularChange: (valor: string) => void
  onAncoraSuplenteChange: (valor: string) => void
}) {
  return (
    <fieldset className="flex flex-col gap-3 rounded-lg border p-3">
      <legend className="px-1 text-sm font-medium">Rotação</legend>

      {bloqueado ? (
        <>
          <div className="rounded-md border bg-muted/40 px-3 py-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium">{rotuloModoRotacao(modo)}</span>
              <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                Fixa
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {modo === 'alfabetica'
                ? 'A fila segue o nome pt-BR.'
                : 'A fila segue as posições do cadastro de oficiais.'}
            </p>
          </div>
          {modo === 'cadastro' ? (
            <CamposAncora
              ancoraTitular={ancoraTitular}
              ancoraSuplente={ancoraSuplente}
              onAncoraTitularChange={onAncoraTitularChange}
              onAncoraSuplenteChange={onAncoraSuplenteChange}
            />
          ) : null}
          <p className="text-xs text-muted-foreground">
            Para mudar a ordem da rotação, use Limpar na grade.
          </p>
        </>
      ) : (
        <>
          <EscolhaModoRotacao
            idPrefix="semana-param"
            value={modo}
            onChange={onModoChange}
            hideLegend
          />
          {modo === 'cadastro' ? (
            <CamposAncora
              ancoraTitular={ancoraTitular}
              ancoraSuplente={ancoraSuplente}
              onAncoraTitularChange={onAncoraTitularChange}
              onAncoraSuplenteChange={onAncoraSuplenteChange}
            />
          ) : null}
        </>
      )}
    </fieldset>
  )
}
