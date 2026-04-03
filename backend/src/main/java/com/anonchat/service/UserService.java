package com.anonchat.service;

import com.anonchat.dto.LoginRequest;
import com.anonchat.dto.UserRegistrationRequest;
import com.anonchat.dto.UserResponse;
import com.anonchat.exception.ConflictException;
import com.anonchat.model.User;
import com.anonchat.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * Handles user registration logic.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    /**
     * Registers a new user after checking for duplicate email.
     */
    public UserResponse register(UserRegistrationRequest request) {
        log.info("Registering user with email: {}", request.getEmail());

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ConflictException("Email already registered: " + request.getEmail());
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .phoneNumber(request.getPhoneNumber())
                .country(request.getCountry())
                .gender(request.getGender())
                .build();

        User saved = userRepository.save(user);
        log.info("User registered successfully with id: {}", saved.getId());

        return toResponse(saved);
    }

    /**
     * Logs in a user by matching email + phone number.
     */
    public UserResponse login(LoginRequest request) {
        log.info("Login attempt for email: {}", request.getEmail());
        User user = userRepository.findByEmailAndPhoneNumber(request.getEmail(), request.getPhoneNumber())
                .orElseThrow(() -> new com.anonchat.exception.NotFoundException(
                        "No account found with that email and phone number"));
        log.info("Login successful for user id: {}", user.getId());
        return toResponse(user);
    }

    /**
     * Fetches a user by ID (used internally for validation).
     */
    public User getById(String userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new com.anonchat.exception.NotFoundException("User not found: " + userId));
    }

    private UserResponse toResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .country(user.getCountry())
                .gender(user.getGender())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
