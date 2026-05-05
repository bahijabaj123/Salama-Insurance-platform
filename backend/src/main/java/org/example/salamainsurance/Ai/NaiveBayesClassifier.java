package org.example.salamainsurance.Ai;

import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class NaiveBayesClassifier {

  private final TextProcessor processor = new TextProcessor();

  private final Map<String, Integer> positiveWords = new HashMap<>();
  private final Map<String, Integer> negativeWords = new HashMap<>();

  private int totalPositiveWords = 0;
  private int totalNegativeWords = 0;
  private int positiveDocs = 0;
  private int negativeDocs = 0;

  public void train(List<String[]> data) {
    for (String[] row : data) {
      if (row.length < 2) continue;

      String cleanedText = processor.preprocess(row[0]);
      String sentimentRaw = row[1].trim().toUpperCase();

      // Normaliser le sentiment
      int sentiment = normalizeSentimentToInt(sentimentRaw);

      String[] words = cleanedText.split("\\s+");
      if (sentiment == 1) {
        positiveDocs++;
        for (String word : words) {
          if (word.isEmpty()) continue;
          positiveWords.put(word, positiveWords.getOrDefault(word, 0) + 1);
          totalPositiveWords++;
        }
      } else if (sentiment == 0) {
        negativeDocs++;
        for (String word : words) {
          if (word.isEmpty()) continue;
          negativeWords.put(word, negativeWords.getOrDefault(word, 0) + 1);
          totalNegativeWords++;
        }
      }
      // Les sentiments NEUTRAL sont ignorés pour l'entraînement
    }
    System.out.println("✅ IA Salama : Entraînement terminé");
    System.out.println("   📈 POSITIVE: " + positiveDocs + " phrases");
    System.out.println("   📉 NEGATIVE: " + negativeDocs + " phrases");
    System.out.println("   📚 Vocabulaire: " + getUniqueWordsCount() + " mots uniques");
  }

  /**
   * Prédit le sentiment d'un texte
   * Retourne POSITIVE, NEGATIVE ou NEUTRAL
   */
  public String predict(String text) {
    if (text == null || text.trim().isEmpty()) {
      return "NEUTRAL";
    }

    String cleanedText = processor.preprocess(text);
    String[] words = cleanedText.split("\\s+");

    // Probabilité de base (Prior probability)
    double logPos = Math.log((double) positiveDocs / (positiveDocs + negativeDocs + 1));
    double logNeg = Math.log((double) negativeDocs / (positiveDocs + negativeDocs + 1));

    // Calcul de la probabilité selon les mots (Lissage de Laplace +1)
    int vocabSize = getUniqueWordsCount();

    for (String word : words) {
      if (word.isEmpty()) continue;

      // Score Positif
      int posOccurrences = positiveWords.getOrDefault(word, 0);
      logPos += Math.log((double) (posOccurrences + 1) / (totalPositiveWords + vocabSize));

      // Score Négatif
      int negOccurrences = negativeWords.getOrDefault(word, 0);
      logNeg += Math.log((double) (negOccurrences + 1) / (totalNegativeWords + vocabSize));
    }

    // Calculer la différence de probabilité
    double difference = Math.abs(logPos - logNeg);
    double threshold = 0.5; // Seuil pour déterminer NEUTRAL

    // Si la différence est trop faible, le sentiment est NEUTRAL
    if (difference < threshold) {
      return "NEUTRAL";
    }

    // Normaliser le résultat
    String result = logPos > logNeg ? "POSITIVE" : "NEGATIVE";

    return result;
  }

  /**
   * Normalise le sentiment en entier (1=POSITIVE, 0=NEGATIVE, -1=NEUTRAL)
   */
  private int normalizeSentimentToInt(String sentiment) {
    if (sentiment == null) return -1;

    switch (sentiment) {
      case "1":
      case "POSITIVE":
      case "POSITIF":
      case "TRUE":
      case "YES":
      case "OUI":
        return 1;
      case "0":
      case "NEGATIVE":
      case "NEGATIF":
      case "FALSE":
      case "NO":
      case "NON":
        return 0;
      default:
        return -1;
    }
  }

  private int getUniqueWordsCount() {
    Set<String> allWords = new HashSet<>(positiveWords.keySet());
    allWords.addAll(negativeWords.keySet());
    return allWords.size();
  }
}
