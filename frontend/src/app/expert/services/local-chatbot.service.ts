import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

import { LocalChatbotEngine } from './local-chatbot/local-chatbot.engine';
import type { LocalPredictResult, TrainingExample } from './local-chatbot/local-chatbot.types';
import { normalizeText } from './local-chatbot/text-similarity.util';

const STORAGE_KEY = 'salama-local-chatbot-training-v1';

/**
 * Chatbot métier 100 % local : TF-IDF + similarité (voir `LocalChatbotEngine`).
 * Données initiales : `public/data/local-chatbot-training.json`
 * Exemples ajoutés : `localStorage` (clé {@link STORAGE_KEY}).
 */
@Injectable({ providedIn: 'root' })
export class LocalChatbotService {
  /** Seuil en dessous duquel on considère l’intention comme inconnue. */
  readonly minConfidence = 0.42;

  readonly isReady = signal(false);
  /** Nombre d’exemples ajoutés manuellement (hors fichier JSON). */
  readonly customExampleCount = signal(0);

  private readonly engine = new LocalChatbotEngine();
  private baseExamples: TrainingExample[] = [];

  constructor(private http: HttpClient) {
    this.engine.setThreshold(this.minConfidence);
  }

  /**
   * Charge le JSON public + fusionne les exemples `localStorage`, puis entraîne.
   */
  initFromAssets(): Observable<void> {
    return this.http.get<TrainingExample[]>('/data/local-chatbot-training.json').pipe(
      catchError(() => of([] as TrainingExample[])),
      tap((file) => {
        this.baseExamples = Array.isArray(file)
          ? file.filter((e) => e?.text?.trim() && e?.label?.trim())
          : [];
      }),
      map(() => {
        this.rebuildModel();
        this.isReady.set(true);
      })
    );
  }

  /**
   * Prédit le label le plus proche (avec score de confiance).
   * Équivalent fonctionnel de `predict(message)` demandée dans le cahier des charges.
   */
  predict(message: string): LocalPredictResult {
    return this.engine.predict(message);
  }

  /**
   * Ajoute un exemple et persiste dans `localStorage`, puis ré-entraîne.
   */
  addTrainingExample(text: string, label: string): void {
    const t = text.trim();
    const l = label.trim();
    if (!t || !l) return;
    const custom = this.loadCustom();
    custom.push({ text: t, label: l });
    this.saveCustom(custom);
    this.rebuildModel();
  }

  /** Exemples personnalisés uniquement (utile pour export / debug). */
  getCustomExamples(): TrainingExample[] {
    return this.loadCustom();
  }

  /**
   * Tente d’interpréter une commande d’apprentissage dans le chat.
   * Formats acceptés : `!learn texte | label` ou `!apprendre texte | label`
   */
  tryParseLearnCommand(message: string): { text: string; label: string } | null {
    const m = message.match(/^\s*!(?:learn|apprendre)\s+(.+?)\s*\|\s*(.+)\s*$/i);
    if (!m) return null;
    const text = m[1].trim();
    const label = m[2].trim();
    return text && label ? { text, label } : null;
  }

  private rebuildModel(): void {
    const custom = this.loadCustom();
    const merged = dedupeExamples([...this.baseExamples, ...custom]);
    this.engine.train(merged);
    this.customExampleCount.set(custom.length);
  }

  private loadCustom(): TrainingExample[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const p = JSON.parse(raw) as unknown;
      if (!Array.isArray(p)) return [];
      return p
        .filter((x): x is TrainingExample => !!x && typeof x === 'object' && 'text' in x && 'label' in x)
        .map((x) => ({ text: String(x.text).trim(), label: String(x.label).trim() }))
        .filter((e) => e.text && e.label);
    } catch {
      return [];
    }
  }

  private saveCustom(examples: TrainingExample[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(examples));
    } catch {
      /* quota / mode privé */
    }
  }
}

function dedupeExamples(list: TrainingExample[]): TrainingExample[] {
  const seen = new Set<string>();
  const out: TrainingExample[] = [];
  for (const e of list) {
    const key = `${normalizeText(e.text)}|${e.label.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(e);
  }
  return out;
}
