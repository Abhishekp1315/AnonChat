package com.anonchat.service;

import com.anonchat.dto.UserRegistrationRequest;
import com.anonchat.dto.UserResponse;
import com.anonchat.exception.ConflictException;
import com.anonchat.model.User;
import com.anonchat.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserService userService;

    private UserRegistrationRequest request;

    @BeforeEach
    void setUp() {
        request = new UserRegistrationRequest();
        request.setName("Alice");
        request.setEmail("alice@example.com");
        request.setPhoneNumber("+1234567890");
        request.setCountry("US");
        request.setGender("FEMALE");
    }

    @Test
    void register_success() {
        when(userRepository.existsByEmail(request.getEmail())).thenReturn(false);

        User saved = User.builder()
                .id("user-1")
                .name(request.getName())
                .email(request.getEmail())
                .country(request.getCountry())
                .gender(request.getGender())
                .createdAt(Instant.now())
                .build();

        when(userRepository.save(any(User.class))).thenReturn(saved);

        UserResponse response = userService.register(request);

        assertThat(response.getId()).isEqualTo("user-1");
        assertThat(response.getName()).isEqualTo("Alice");
        verify(userRepository).save(any(User.class));
    }

    @Test
    void register_duplicateEmail_throwsConflict() {
        when(userRepository.existsByEmail(request.getEmail())).thenReturn(true);

        assertThatThrownBy(() -> userService.register(request))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("already registered");

        verify(userRepository, never()).save(any());
    }
}
