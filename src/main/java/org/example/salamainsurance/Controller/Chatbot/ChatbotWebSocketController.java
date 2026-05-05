/*package org.example.salamainsurance.Controller.Chatbot;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.salamainsurance.DTO.ChatRequest;
import org.example.salamainsurance.DTO.ChatResponse;
import org.example.salamainsurance.Service.Chatbot.GeminiChatService;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
@Slf4j
public class ChatbotWebSocketController {

  private final GeminiChatService chatService;

  @MessageMapping("/chat")
  @SendTo("/topic/messages")
  public ChatResponse handleChat(ChatRequest request) {
    log.info("Message reçu: {}", request.getMessage());
    return chatService.processMessage(request);
  }
}
*/
