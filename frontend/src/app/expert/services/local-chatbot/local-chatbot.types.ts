/** Une paire texte → intention (label) pour l’entraînement local. */
export interface TrainingExample {
  text: string;
  label: string;
}

/** Résultat de la classification locale. */
export interface LocalPredictResult {
  label: string;
  /** Score combiné entre 0 et 1 (similarité TF-IDF + tolérance fautes). */
  confidence: number;
  /** Exemple d’entraînement le plus proche (texte brut). */
  matchedText: string;
  /** Indique si le score est sous le seuil — utiliser une réponse de secours. */
  belowThreshold: boolean;
}
