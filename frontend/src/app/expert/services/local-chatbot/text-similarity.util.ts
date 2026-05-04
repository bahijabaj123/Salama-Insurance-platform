/**
 * Utilitaires NLP légers : normalisation, TF-IDF, cosinus, Levenshtein.
 * Tout reste côté client, sans API externe.
 */

/** Supprime accents et caractères parasites pour rapprocher "créer" / "creer". */
export function normalizeText(raw: string): string {
  return raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function tokenize(raw: string): string[] {
  const n = normalizeText(raw);
  return n ? n.split(' ') : [];
}

/** Distance de Levenshtein (édition). */
export function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const row = new Array<number>(n + 1);
  for (let j = 0; j <= n; j++) row[j] = j;
  for (let i = 1; i <= m; i++) {
    let prev = i - 1;
    row[0] = i;
    for (let j = 1; j <= n; j++) {
      const tmp = row[j];
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + cost);
      prev = tmp;
    }
  }
  return row[n];
}

/** Similarité 0–1 (1 = identique). Bonne tolérance pour fautes type "bonjor". */
export function levenshteinRatio(a: string, b: string): number {
  const na = normalizeText(a);
  const nb = normalizeText(b);
  if (!na && !nb) return 1;
  if (!na || !nb) return 0;
  const d = levenshtein(na, nb);
  const mx = Math.max(na.length, nb.length, 1);
  return Math.max(0, 1 - d / mx);
}

function magnitude(vec: number[]): number {
  let s = 0;
  for (const v of vec) s += v * v;
  return Math.sqrt(s) || 1e-9;
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0;
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
  return dot / (magnitude(a) * magnitude(b));
}

export interface TfidfModel {
  vocab: string[];
  idf: number[];
  docTokenLists: string[][];
  /** Vecteurs TF-IDF L2-normalisés par document d’entraînement. */
  docVectors: number[][];
  vectorize(tokens: string[]): number[];
}

/** Entraîne un petit modèle TF-IDF sur les textes d’exemple. */
export function buildTfidfModel(docTokenLists: string[][]): TfidfModel {
  const vocabSet = new Set<string>();
  for (const tokens of docTokenLists) {
    for (const t of tokens) vocabSet.add(t);
  }
  const vocab = [...vocabSet].sort();
  const N = docTokenLists.length || 1;
  const df = vocab.map((term) => docTokenLists.filter((d) => d.includes(term)).length);
  const idf = df.map((dfi) => Math.log((N + 1) / (dfi + 1)) + 1);

  function vectorize(tokens: string[]): number[] {
    const vec = new Array(vocab.length).fill(0);
    if (!tokens.length) return vec;
    const counts = new Map<string, number>();
    for (const t of tokens) counts.set(t, (counts.get(t) ?? 0) + 1);
    let maxTf = 0;
    for (const c of counts.values()) maxTf = Math.max(maxTf, c);
    maxTf = maxTf || 1;
    for (const [term, c] of counts) {
      const i = vocab.indexOf(term);
      if (i >= 0) vec[i] = (c / maxTf) * idf[i];
    }
    const mag = magnitude(vec);
    if (mag > 0) {
      for (let i = 0; i < vec.length; i++) vec[i] /= mag;
    }
    return vec;
  }

  const docVectors = docTokenLists.map((d) => vectorize(d));
  return { vocab, idf, docTokenLists, docVectors, vectorize };
}
