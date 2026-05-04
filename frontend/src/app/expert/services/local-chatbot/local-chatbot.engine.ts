import type { LocalPredictResult, TrainingExample } from './local-chatbot.types';
import {
  buildTfidfModel,
  levenshteinRatio,
  normalizeText,
  tokenize,
  type TfidfModel
} from './text-similarity.util';

const DEFAULT_THRESHOLD = 0.42;
/** Poids TF-IDF vs similarité caractères (fautes). */
const W_TFIDF = 0.55;
const W_LEV = 0.45;

/**
 * Moteur d’entraînement / prédiction local.
 * Reconstruire le modèle après chaque modification du jeu d’exemples.
 */
export class LocalChatbotEngine {
  private examples: TrainingExample[] = [];
  private model: TfidfModel | null = null;
  private threshold = DEFAULT_THRESHOLD;

  setThreshold(t: number): void {
    this.threshold = Math.max(0.15, Math.min(0.95, t));
  }

  getThreshold(): number {
    return this.threshold;
  }

  getExamples(): TrainingExample[] {
    return [...this.examples];
  }

  /** Remplace les exemples et recalcule TF-IDF. */
  train(examples: TrainingExample[]): void {
    this.examples = examples
      .filter((e) => e.text?.trim() && e.label?.trim())
      .map((e) => ({ text: e.text.trim(), label: e.label.trim() }));
    const docTokenLists = this.examples.map((e) => tokenize(e.text));
    this.model = docTokenLists.length ? buildTfidfModel(docTokenLists) : null;
  }

  /**
   * Trouve l’exemple le plus proche : cosinus TF-IDF + ratio Levenshtein sur texte normalisé.
   */
  predict(message: string): LocalPredictResult {
    const raw = message.trim();
    if (!raw || !this.model || !this.examples.length) {
      return {
        label: 'unknown',
        confidence: 0,
        matchedText: '',
        belowThreshold: true
      };
    }

    const qTokens = tokenize(raw);
    const qVec = this.model.vectorize(qTokens);
    const qNorm = normalizeText(raw);

    let bestIdx = 0;
    let bestScore = -1;

    for (let i = 0; i < this.examples.length; i++) {
      const cos = Math.max(0, cosineSafe(qVec, this.model.docVectors[i]));
      const lev = levenshteinRatio(qNorm, normalizeText(this.examples[i].text));
      const score = W_TFIDF * cos + W_LEV * lev;
      if (score > bestScore) {
        bestScore = score;
        bestIdx = i;
      }
    }

    const ex = this.examples[bestIdx];
    const below = bestScore < this.threshold;
    return {
      label: below ? 'unknown' : ex.label,
      confidence: Math.min(1, Math.round(bestScore * 1000) / 1000),
      matchedText: ex.text,
      belowThreshold: below
    };
  }

  addExample(text: string, label: string): void {
    const t = text.trim();
    const l = label.trim();
    if (!t || !l) return;
    this.examples.push({ text: t, label: l });
    const docTokenLists = this.examples.map((e) => tokenize(e.text));
    this.model = buildTfidfModel(docTokenLists);
  }
}

function cosineSafe(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const d = Math.sqrt(na) * Math.sqrt(nb);
  return d > 0 ? dot / d : 0;
}
