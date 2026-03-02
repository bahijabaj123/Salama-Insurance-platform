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
            int sentiment = Integer.parseInt(row[1].trim());

            String[] words = cleanedText.split("\\s+");
            if (sentiment == 1) {
                positiveDocs++;
                for (String word : words) {
                    if (word.isEmpty()) continue;
                    positiveWords.put(word, positiveWords.getOrDefault(word, 0) + 1);
                    totalPositiveWords++;
                }
            } else {
                negativeDocs++;
                for (String word : words) {
                    if (word.isEmpty()) continue;
                    negativeWords.put(word, negativeWords.getOrDefault(word, 0) + 1);
                    totalNegativeWords++;
                }
            }
        }
        System.out.println("✅ IA Salama : Entraînement bilingue terminé (" + (positiveDocs + negativeDocs) + " phrases)");
    }

    /**
     * Prédit si une nouvelle réclamation est POSITIVE ou NÉGATIVE
     */
    public String predict(String text) {
        String cleanedText = processor.preprocess(text);
        String[] words = cleanedText.split("\\s+");

        // Probabilité de base (Prior probability)
        double logPos = Math.log((double) positiveDocs / (positiveDocs + negativeDocs));
        double logNeg = Math.log((double) negativeDocs / (positiveDocs + negativeDocs));

        // Calcul de la probabilité selon les mots (Lissage de Laplace +1 pour éviter proba = 0)
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

        return logPos > logNeg ? "POSITIF" : "NÉGATIF";
    }

    private int getUniqueWordsCount() {
        Set<String> allWords = new HashSet<>(positiveWords.keySet());
        allWords.addAll(negativeWords.keySet());
        return allWords.size();
    }
}