package com.anonchat.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.Map;

/**
 * Represents a single chat message within a room.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "chat_messages")
public class ChatMessage {

    @Id
    private String id;

    private String roomId;

    /** Anonymous sender identifier */
    private String senderId;

    private String message;

    private Instant timestamp;

    private MessageType type;

    /** emoji → senderId map for reactions, e.g. {"👍": "user-2"} */
    @Builder.Default
    private Map<String, String> reactions = new java.util.HashMap<>();

    public enum MessageType {
        CHAT, JOIN, LEAVE, TYPING, SYSTEM
    }
}
