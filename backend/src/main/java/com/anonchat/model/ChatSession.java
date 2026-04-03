package com.anonchat.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/**
 * Represents a chat session between two anonymous users.
 * Persisted to MongoDB for history/audit purposes.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "chat_sessions")
public class ChatSession {

    @Id
    private String id;

    /** Unique room identifier shared between matched users */
    private String roomId;

    /** User IDs of the two participants */
    private String user1Id;
    private String user2Id;

    private SessionStatus status;

    private Instant startedAt;
    private Instant endedAt;

    /** Ratings submitted by each participant after session ends */
    private Integer ratingUser1;
    private Integer ratingUser2;

    public enum SessionStatus {
        ACTIVE, ENDED, TIMED_OUT
    }
}
