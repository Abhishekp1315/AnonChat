package com.anonchat.dto;

import lombok.Builder;
import lombok.Data;

/**
 * Response returned when a chat session is matched or created.
 */
@Data
@Builder
public class ChatSessionResponse {
    private String roomId;
    private String status;   // WAITING | MATCHED | ENDED
    private String message;
}
