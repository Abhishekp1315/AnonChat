package com.anonchat.controller;

import com.anonchat.dto.UserRegistrationRequest;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Basic integration test for the user registration endpoint.
 * Requires a running MongoDB and Redis (use test profile with embedded or mocked).
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class UserControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void register_validRequest_returns201() throws Exception {
        UserRegistrationRequest req = new UserRegistrationRequest();
        req.setName("Bob");
        req.setEmail("bob_" + System.currentTimeMillis() + "@example.com");
        req.setPhoneNumber("+9876543210");
        req.setCountry("UK");
        req.setGender("MALE");

        mockMvc.perform(post("/api/users/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.name").value("Bob"));
    }

    @Test
    void register_missingEmail_returns400() throws Exception {
        UserRegistrationRequest req = new UserRegistrationRequest();
        req.setName("Bob");
        req.setPhoneNumber("+9876543210");
        req.setCountry("UK");
        req.setGender("MALE");

        mockMvc.perform(post("/api/users/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }
}
