export type Papel = 'editor' | 'leitor'

export function isPapel(value: unknown): value is Papel {
  return value === 'editor' || value === 'leitor'
}
