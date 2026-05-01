package org.example.salamainsurance.Ai;

import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

public class DataLoader {

  /**
   * Charge les données de réclamation depuis un fichier CSV.
   * Le format attendu est : "phrase",sentiment
   */
  public List<String[]> loadClaims(String filePath) {
    List<String[]> data = new ArrayList<>();

    try (BufferedReader br = new BufferedReader(new FileReader(filePath))) {
      String line;
      // On saute la première ligne (l'en-tête : phrase,sentiment)
      br.readLine();

      while ((line = br.readLine()) != null) {
        // Regex pour séparer par la virgule tout en ignorant les virgules à l'intérieur des guillemets
        String[] columns = line.split(",(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)");

        if (columns.length >= 2) {
          // On nettoie les guillemets éventuels autour de la phrase
          String phrase = columns[0].replace("\"", "").trim();
          String sentiment = columns[1].trim();

          data.add(new String[]{phrase, sentiment});
        }
      }
      System.out.println("📊 DataLoader : " + data.size() + " lignes chargées depuis le CSV.");

    } catch (IOException e) {
      System.err.println("❌ Erreur lors de la lecture du fichier CSV : " + e.getMessage());
      // Affiche le chemin absolu pour t'aider à déboguer si le fichier n'est pas trouvé
      System.err.println("Chemin tenté : " + new java.io.File(filePath).getAbsolutePath());
    }

    return data;
  }
}
