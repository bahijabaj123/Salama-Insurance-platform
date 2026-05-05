package org.example.salamainsurance.Ai;

import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

public class TextProcessor {


  private static final Set<String> STOP_WORDS = new HashSet<>(Arrays.asList(
    // Français
    "je", "tu", "il", "elle", "nous", "vous", "ils", "le", "la", "les",
    "un", "une", "des", "du", "de", "ce", "cette", "ces", "mon", "ma",
    "votre", "notre", "est", "ai", "au", "aux", "avec", "pour", "dans",
    // Anglais
    "i", "you", "he", "she", "it", "we", "they", "the", "a", "an", "and",
    "or", "but", "is", "am", "are", "was", "were", "my", "your", "his",
    "her", "their", "this", "that", "with", "for", "of", "in", "at"
  ));


  public String preprocess(String text) {
    if (text == null || text.isEmpty()) {
      return "";
    }

    String processed = text.toLowerCase();

    // 2. Suppression de la ponctuation et des caractères spéciaux
    // On garde les lettres et les espaces (y compris les accents français)
    processed = processed.replaceAll("[^a-zàâçéèêëîïôûù ]", " ");

    // 3. Tokenisation (découpage en mots) et filtrage
    return Arrays.stream(processed.split("\\s+"))
      .filter(word -> word.length() > 2) // On ignore les mots de 1 ou 2 lettres
      .filter(word -> !STOP_WORDS.contains(word)) // On retire les stop words
      .collect(Collectors.joining(" "));
  }
}
