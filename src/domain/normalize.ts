// Normaliza nombres de cartas para compararlos sin importar acentos, mayúsculas ni guiones.

const STOPWORDS = new Set(['de', 'del', 'la', 'el', 'los', 'las', 'team', 'of', 's']);

export function normalizeName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[’'`´]/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function nameTokens(name: string): string[] {
  return normalizeName(name)
    .split(' ')
    .filter((token) => token.length > 0 && !STOPWORDS.has(token));
}

/** Una carta clave coincide si todas sus palabras están en la carta vista, como "Zoroark ex" en "Zoroark ex de N". */
export function keyCardMatches(keyName: string, seenName: string): boolean {
  const key = nameTokens(keyName);
  if (key.length === 0) return false;
  const seen = new Set(nameTokens(seenName));
  return key.every((token) => seen.has(token));
}
