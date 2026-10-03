const ROTULOS = [
  'Juizado da Infância e Juventude',
  '2.ª Vara de Família e 3.ª Vara Cível',
  '2.ª Vara Criminal',
] as const

export function rotuloVaraTitular(posicao: number): string | null {
  return ROTULOS[posicao - 1] ?? null
}
