package com.anonchat.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class RatingRequest {
    @NotBlank
    private String roomId;
    @NotBlank
    private String userId;
    @Min(1) @Max(5)
    private int stars;
}
