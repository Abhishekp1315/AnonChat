package com.anonchat.websocket;

import com.anonchat.dto.MessagePayload;
import com.anonchat.service.ChatService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Controller;

/**
 * Handles all inbound STOMP destinations under /app/
 */
@Slf4j
@Controller
@RequiredArgsConstructor
public class ChatWebSocketController {

    private final ChatService chatService;

    /** /app/sendMessage */
    @MessageMapping("/sendMessage")
    public void sendMessage(@Payload MessagePayload payload) {
        payload.setType("CHAT");
        chatService.processMessage(payload);
    }

    /** /app/typing */
    @MessageMapping("/typing")
    public void typing(@Payload MessagePayload payload) {
        payload.setType("TYPING");
        chatService.processMessage(payload);
    }

    /** /app/readReceipt — broadcast seen status to room */
    @MessageMapping("/readReceipt")
    public void readReceipt(@Payload MessagePayload payload) {
        payload.setType("READ_RECEIPT");
        chatService.processMessage(payload);
    }

    /** /app/react — toggle emoji reaction on a message */
    @MessageMapping("/react")
    public void react(@Payload MessagePayload payload) {
        payload.setType("REACTION");
        chatService.processMessage(payload);
    }
}
