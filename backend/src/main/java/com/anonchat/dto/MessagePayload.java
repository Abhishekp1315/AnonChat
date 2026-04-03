package com.anonchat.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.Instant;

/**
 * WebSocket message payload sent via STOMP /app/sendMessage.
 */
@Data
public class MessagePayload {

    private String id; // message ID (for reactions/receipts)

    @NotBlank(message = "senderId is required")
    private String senderId;

    @NotBlank(message = "roomId is required")
    private String roomId;

    @Size(max = 1000, message = "Message too long (max 1000 chars)")
    private String message;

    private Instant timestamp;

    /** CHAT | TYPING | READ_RECEIPT | REACTION | SYSTEM | JOIN | LEAVE */
    private String type;

    /** For REACTION type: the emoji reacted with */
    private String reaction;

    /** For REACTION type: the message ID being reacted to */
    private String targetMessageId;
}
