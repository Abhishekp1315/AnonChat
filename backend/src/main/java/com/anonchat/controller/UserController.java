package com.anonchat.controller;

import com.anonchat.dto.LoginRequest;
import com.anonchat.dto.ApiResponse;
import com.anonchat.dto.UserRegistrationRequest;
import com.anonchat.dto.UserResponse;
import com.anonchat.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for user registration.
 */
@Slf4j
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Tag(name = "Users", description = "User registration endpoints")
public class UserController {

    private final UserService userService;

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Register a new user", description = "Creates a new anonymous chat user account")
    public ApiResponse<UserResponse> register(@Valid @RequestBody UserRegistrationRequest request) {
        log.info("POST /api/users/register");
        UserResponse response = userService.register(request);
        return ApiResponse.ok("User registered successfully", response);
    }

    @PostMapping("/login")
    @Operation(summary = "Login", description = "Authenticate with email + phone number")
    public ApiResponse<UserResponse> login(@Valid @RequestBody LoginRequest request) {
        log.info("POST /api/users/login");
        UserResponse response = userService.login(request);
        return ApiResponse.ok("Login successful", response);
    }
}
