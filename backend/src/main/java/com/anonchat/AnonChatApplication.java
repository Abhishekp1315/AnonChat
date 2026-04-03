package com.anonchat;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Entry point for the Anonymous Chat Application.
 */
@SpringBootApplication
@EnableScheduling
public class AnonChatApplication {
    public static void main(String[] args) {
        SpringApplication.run(AnonChatApplication.class, args);
    }
}
