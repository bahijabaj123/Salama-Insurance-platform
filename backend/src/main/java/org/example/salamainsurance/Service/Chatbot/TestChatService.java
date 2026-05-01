// Service/TestChatService.java
package org.example.salamainsurance.Service.Chatbot;

import lombok.extern.slf4j.Slf4j;
import org.example.salamainsurance.DTO.ChatRequest;
import org.example.salamainsurance.DTO.ChatResponse;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@Slf4j
public class TestChatService {

  public ChatResponse processMessage(ChatRequest request) {
    log.info("Test Service - Message reçu: {}", request.getMessage());

    String message = request.getMessage().toLowerCase();
    String response;

    if (message.contains("sinistre") || message.contains("déclarer")) {
      response = "🎯 Pour déclarer un sinistre :\n\n1️⃣ Connectez-vous à votre espace client\n2️⃣ Cliquez sur 'Nouvelle déclaration'\n3️⃣ Remplissez le formulaire avec les détails de l'accident\n4️⃣ Joignez les photos des dégâts\n5️⃣ Validez et soumettez\n\nSouhaitez-vous que je vous guide pas à pas ?";
    }
    else if (message.contains("statut")) {
      if (request.getClaimId() != null) {
        response = "📋 Votre sinistre #" + request.getClaimId() + " est actuellement en cours de traitement par notre équipe d'experts. Un email vous sera envoyé dès qu'il y aura une mise à jour.";
      } else {
        response = "🔍 Pour connaître le statut de votre sinistre, veuillez me donner le numéro de référence ou vous rendre dans l'onglet 'Mes sinistres' de votre espace client.";
      }
    }
    else if (message.contains("document")) {
      response = "📄 Documents nécessaires :\n• Constat amiable signé\n• Photos des dégâts\n• Carte grise du véhicule\n• Permis de conduire\n• Relevé d'information\n• Devis de réparation (si disponible)\n\nVous pouvez tous les télécharger depuis votre espace client.";
    }
    else if (message.contains("expert")) {
      response = "👨‍🔧 Un expert sera automatiquement assigné à votre dossier sous 24h. Vous recevrez ses coordonnées par email. Il pourra vous contacter pour planifier l'expertise.";
    }
    else if (message.contains("délai")) {
      response = "⏱️ Délais estimés :\n• Traitement initial : 2-3 jours\n• Expertise : 5-7 jours\n• Indemnisation : 3-5 jours après validation\nSoit environ 10-15 jours ouvrés au total.";
    }
    else {
      response = "🤖 Bonjour ! Je suis l'assistant intelligent de Salama Insurance. Je peux vous aider avec :\n\n✅ Déclaration de sinistre\n✅ Suivi de dossier\n✅ Documents nécessaires\n✅ Informations expert\n✅ Délais d'indemnisation\n\nComment puis-je vous aider aujourd'hui ?";
    }

    return ChatResponse.builder()
      .message(response)
      .sender("bot")
      .timestamp(LocalDateTime.now())
      .intent("general")
      .build();
  }
}
