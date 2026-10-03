import { Label } from '@/components/ui/label'
import { rotuloModoRotacao, type ModoRotacao } from '@/lib/escala'

export function EscolhaModoRotacao({
  idPrefix,
  value,
  onChange,
  disabled,
  hideLegend,
}: {
  idPrefix: string
  value: ModoRotacao
  onChange: (modo: ModoRotacao) => void
  disabled?: boolean
  hideLegend?: boolean
}) {
  return (
    <fieldset className="flex flex-col gap-2" disabled={disabled}>
      {hideLegend ? null : (
        <legend className="text-sm font-medium">Ordem da rotação</legend>
      )}
      {(['alfabetica', 'cadastro'] as const).map((modo) => (
        <div key={modo} className="flex items-center gap-2">
          <input
            id={`${idPrefix}-${modo}`}
            type="radio"
            name={`${idPrefix}-modo-rotacao`}
            value={modo}
            checked={value === modo}
            onChange={() => onChange(modo)}
          />
          <Label htmlFor={`${idPrefix}-${modo}`}>{rotuloModoRotacao(modo)}</Label>
        </div>
      ))}
    </fieldset>
  )
}
