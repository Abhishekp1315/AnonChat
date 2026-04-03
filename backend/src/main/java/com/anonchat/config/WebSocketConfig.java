package com.anonchat.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.*;

/**
 * Configures STOMP over WebSocket.
 * - /ws is the handshake endpoint
 * - /app prefix routes to @MessageMapping methods
 * - /topic prefix is for subscriptions (broadcast)
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Value("${spring.websocket.allowed-origins:http://localhost:3000}")
    private String allowedOrigins;

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns(allowedOrigins, "http://localhost:*")
                .withSockJS(); // SockJS fallback for browsers that don't support WS
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // Prefix for messages routed to @MessageMapping methods
        registry.setApplicationDestinationPrefixes("/app");
        // Simple in-memory broker for /topic destinations
        registry.enableSimpleBroker("/topic", "/queue");
        // User-specific destinations
        registry.setUserDestinationPrefix("/user");
    }
}
