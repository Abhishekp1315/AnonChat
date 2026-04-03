package com.anonchat.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.config.EnableMongoAuditing;

/**
 * Enables MongoDB auditing so @CreatedDate annotations work automatically.
 */
@Configuration
@EnableMongoAuditing
public class MongoConfig {
}
