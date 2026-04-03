package com.anonchat.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/**
 * Validates critical configuration on startup and logs a clear warning
 * if default/placeholder values are detected.
 */
@Slf4j
@Component
public class StartupValidator {

    @Value("${spring.data.mongodb.uri}")
    private String mongoUri;

    @Value("${spring.data.redis.host}")
    private String redisHost;

    @EventListener(ApplicationReadyEvent.class)
    public void validate() {
        log.info("=== AnonChat Startup Configuration Check ===");

        if (mongoUri.contains("localhost")) {
            log.warn("MongoDB is pointing to localhost. " +
                     "For production, set MONGODB_URI to your Atlas connection string.");
        } else {
            log.info("MongoDB: configured (Atlas/remote)");
        }

        if ("localhost".equals(redisHost)) {
            log.warn("Redis is pointing to localhost. " +
                     "For production, set REDIS_HOST to your Upstash endpoint.");
        } else {
            log.info("Redis: configured (remote)");
        }

        log.info("=== Configuration Check Complete ===");
    }
}
