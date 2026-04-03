package com.anonchat.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

/**
 * Scheduled service that cleans up stale queue entries.
 * Redis TTLs handle most cleanup, but this catches edge cases.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class IdleCleanupService {

    private final MatchmakingService matchmakingService;

    /**
     * Logs queue size every minute for monitoring.
     */
    @Scheduled(fixedDelay = 60_000)
    public void logQueueStats() {
        long queueSize = matchmakingService.getQueueSize();
        log.info("Matchmaking queue size: {}", queueSize);
    }
}
