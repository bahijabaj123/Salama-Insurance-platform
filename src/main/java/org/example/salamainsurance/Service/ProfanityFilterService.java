package org.example.salamainsurance.Service;

import org.springframework.stereotype.Service;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

@Service
public class ProfanityFilterService {

  // ✅ Liste ultra précise - seulement les vrais insultes
  private static final Set<String> BAD_WORDS = new HashSet<>(Arrays.asList(
    "merde", "putain", "connard", "salope", "enculé", "bâtard",
    "fuck", "shit", "bitch", "asshole"
  ));

  public boolean containsProfanity(String text) {
    if (text == null || text.isEmpty()) {
      return false;
    }

    String lowerText = text.toLowerCase();

    for (String badWord : BAD_WORDS) {
      if (lowerText.contains(badWord)) {
        System.out.println("🔴 Gros mot détecté: " + badWord);
        return true;
      }
    }
    return false;
  }
}
