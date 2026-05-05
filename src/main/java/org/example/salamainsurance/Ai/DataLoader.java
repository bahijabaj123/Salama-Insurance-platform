package org.example.salamainsurance.Ai;

import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;

public class DataLoader {

  /**
   * Charge les données de réclamation depuis un fichier CSV.
   * Le format attendu est : "phrase",sentiment
   * Sentiment accepté : POSITIVE, NEGATIVE, NEUTRAL, 1, 0
   */
  public List<String[]> loadClaims(String filePath) {
    List<String[]> data = new ArrayList<>();

    try (BufferedReader br = new BufferedReader(
      new InputStreamReader(Files.newInputStream(Paths.get(filePath)), StandardCharsets.UTF_8))) {

      String line;
      boolean isFirstLine = true;
      int lineNumber = 0;

      while ((line = br.readLine()) != null) {
        lineNumber++;

        // Ignorer l'en-tête
        if (isFirstLine) {
          isFirstLine = false;
          // Vérifier si la première ligne est un en-tête
          if (line.toLowerCase().contains("phrase") || line.toLowerCase().contains("text")) {
            continue;
          }
        }

        // Ignorer les lignes vides
        if (line.trim().isEmpty()) {
          continue;
        }

        // Parser la ligne CSV
        String[] columns = parseCSVLine(line);

        if (columns.length >= 2) {
          // Nettoyer la phrase (enlever les guillemets)
          String phrase = columns[0].trim();
          if (phrase.startsWith("\"") && phrase.endsWith("\"")) {
            phrase = phrase.substring(1, phrase.length() - 1);
          }

          // Normaliser le sentiment
          String sentiment = normalizeSentiment(columns[1].trim());

          if (sentiment != null && !phrase.isEmpty()) {
            data.add(new String[]{phrase, sentiment});
          }
        }
      }

      System.out.println("📊 DataLoader : " + data.size() + " lignes chargées depuis le CSV.");
      System.out.println("   📈 POSITIVE: " + data.stream().filter(d -> d[1].equals("POSITIVE")).count());
      System.out.println("   📉 NEGATIVE: " + data.stream().filter(d -> d[1].equals("NEGATIVE")).count());
      System.out.println("   😐 NEUTRAL: " + data.stream().filter(d -> d[1].equals("NEUTRAL")).count());

    } catch (IOException e) {
      System.err.println("❌ Erreur lors de la lecture du fichier CSV : " + e.getMessage());
      System.err.println("📁 Chemin tenté : " + new java.io.File(filePath).getAbsolutePath());
    }

    return data;
  }

  /**
   * Parse une ligne CSV en tenant compte des guillemets
   */
  private String[] parseCSVLine(String line) {
    List<String> result = new ArrayList<>();
    boolean inQuotes = false;
    StringBuilder current = new StringBuilder();

    for (int i = 0; i < line.length(); i++) {
      char c = line.charAt(i);

      if (c == '"') {
        inQuotes = !inQuotes;
      } else if (c == ',' && !inQuotes) {
        result.add(current.toString());
        current = new StringBuilder();
      } else {
        current.append(c);
      }
    }
    result.add(current.toString());

    return result.toArray(new String[0]);
  }

  /**
   * Normalise le sentiment en POSITIVE, NEGATIVE ou NEUTRAL
   */
  private String normalizeSentiment(String sentiment) {
    if (sentiment == null) return "NEUTRAL";

    String upper = sentiment.toUpperCase().trim();

    // Sentiments POSITIFS
    if (upper.equals("1") ||
      upper.equals("POSITIVE") ||
      upper.equals("POSITIF") ||
      upper.equals("TRUE") ||
      upper.equals("YES") ||
      upper.equals("OUI")) {
      return "POSITIVE";
    }

    // Sentiments NEGATIFS
    if (upper.equals("0") ||
      upper.equals("NEGATIVE") ||
      upper.equals("NEGATIF") ||
      upper.equals("FALSE") ||
      upper.equals("NO") ||
      upper.equals("NON")) {
      return "NEGATIVE";
    }

    // Sentiment NEUTRAL (valeur par défaut)
    return "NEUTRAL";
  }
}
