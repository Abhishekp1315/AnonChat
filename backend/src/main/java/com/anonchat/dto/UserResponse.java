package com.anonchat.dto;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;

/**
 * DTO returned after user registration. Does NOT expose sensitive fields.
 */
@Data
@Builder
public class UserResponse {
    private String id;
    private String name;
    private String country;
    private String gender;
    private Instant createdAt;
}
