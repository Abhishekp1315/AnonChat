package com.anonchat.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * Request to enter the matchmaking queue.
 */
@Data
public class ChatStartRequest {

    @NotBlank(message = "userId is required")
    private String userId;

    /** Optional vibe for matchmaking: CHILL, RANT, BORED, FLIRTY, DEEP */
    private String vibe;
}
