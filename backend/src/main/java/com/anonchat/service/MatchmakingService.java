package com.anonchat.service;

import com.anonchat.dto.ChatSessionResponse;
import com.anonchat.model.ChatSession;
import com.anonchat.repository.ChatSessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.TimeUnit;

/**
 * Matchmaking with optional vibe-based matching.
 * Queue strategy: try same-vibe queue first, fall back to global queue.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MatchmakingService {

    private static final String GLOBAL_QUEUE      = "chat:queue:global";
    private static final String VIBE_QUEUE_PREFIX = "chat:queue:vibe:";
    private static final String USER_ROOM_PREFIX  = "user:room:";
    private static final String USER_VIBE_PREFIX  = "user:vibe:";
    private static final String ROOM_USERS_PREFIX = "room:users:";
    private static final String ROOM_VIBES_PREFIX = "room:vibes:";   // stores matched vibes

    private final RedisTemplate<String, String> redisTemplate;
    private final ChatSessionRepository chatSessionRepository;

    @Value("${app.chat.queue-ttl-seconds:300}")   private long queueTtlSeconds;
    @Value("${app.chat.session-ttl-seconds:3600}") private long sessionTtlSeconds;

    // ── Join queue ────────────────────────────────────────────────────────────
    public ChatSessionResponse joinQueue(String userId, String vibe) {
        log.info("User {} joining queue with vibe={}", userId, vibe);
        leaveCurrentRoom(userId);

        String normalVibe = (vibe != null && !vibe.isBlank()) ? vibe.toUpperCase() : null;

        // Store user's vibe for later retrieval
        if (normalVibe != null) {
            redisTemplate.opsForValue().set(USER_VIBE_PREFIX + userId, normalVibe,
                    queueTtlSeconds, TimeUnit.SECONDS);
        }

        // 1. Try same-vibe queue
        if (normalVibe != null) {
            String vibeQueue = VIBE_QUEUE_PREFIX + normalVibe;
            String match = redisTemplate.opsForList().leftPop(vibeQueue);
            if (match != null && !match.equals(userId)) {
                return createMatch(userId, match, normalVibe);
            }
            if (match != null && match.equals(userId)) {
                // put back
                redisTemplate.opsForList().rightPush(vibeQueue, match);
            }
        }

        // 2. Try global queue
        String globalMatch = redisTemplate.opsForList().leftPop(GLOBAL_QUEUE);
        if (globalMatch != null && !globalMatch.equals(userId)) {
            String partnerVibe = redisTemplate.opsForValue().get(USER_VIBE_PREFIX + globalMatch);
            return createMatch(userId, globalMatch, normalVibe != null ? normalVibe : partnerVibe);
        }
        if (globalMatch != null && globalMatch.equals(userId)) {
            redisTemplate.opsForList().rightPush(GLOBAL_QUEUE, globalMatch);
        }

        // 3. No match — add to both queues
        if (normalVibe != null) {
            String vibeQueue = VIBE_QUEUE_PREFIX + normalVibe;
            redisTemplate.opsForList().rightPush(vibeQueue, userId);
            redisTemplate.expire(vibeQueue, queueTtlSeconds, TimeUnit.SECONDS);
        }
        redisTemplate.opsForList().rightPush(GLOBAL_QUEUE, userId);
        redisTemplate.expire(GLOBAL_QUEUE, queueTtlSeconds, TimeUnit.SECONDS);

        log.info("User {} waiting in queue", userId);
        return ChatSessionResponse.builder()
                .status("WAITING")
                .message("Waiting for a match...")
                .build();
    }

    public ChatSessionResponse nextUser(String userId) {
        String vibe = redisTemplate.opsForValue().get(USER_VIBE_PREFIX + userId);
        endSession(userId);
        return joinQueue(userId, vibe);
    }

    public ChatSessionResponse endSession(String userId) {
        String roomId = getUserRoom(userId);
        if (roomId != null) {
            chatSessionRepository.findByRoomIdAndStatus(roomId, ChatSession.SessionStatus.ACTIVE)
                    .ifPresent(s -> {
                        s.setStatus(ChatSession.SessionStatus.ENDED);
                        s.setEndedAt(Instant.now());
                        chatSessionRepository.save(s);
                    });
            String roomKey = ROOM_USERS_PREFIX + roomId;
            Set<String> members = redisTemplate.opsForSet().members(roomKey);
            if (members != null) members.forEach(uid -> redisTemplate.delete(USER_ROOM_PREFIX + uid));
            redisTemplate.delete(roomKey);
            redisTemplate.delete(ROOM_VIBES_PREFIX + roomId);
            return ChatSessionResponse.builder().roomId(roomId).status("ENDED").message("Session ended.").build();
        }
        // Remove from queues
        redisTemplate.opsForList().remove(GLOBAL_QUEUE, 1, userId);
        return ChatSessionResponse.builder().status("ENDED").message("Not in a session.").build();
    }

    /** Submit a post-chat rating (1-5 stars) */
    public void submitRating(String roomId, String userId, int stars) {
        chatSessionRepository.findByRoomId(roomId).ifPresent(session -> {
            if (userId.equals(session.getUser1Id())) session.setRatingUser1(stars);
            else if (userId.equals(session.getUser2Id())) session.setRatingUser2(stars);
            chatSessionRepository.save(session);
            log.info("Rating {} stars saved for room {} by user {}", stars, roomId, userId);
        });
    }

    public String getUserRoom(String userId) {
        return redisTemplate.opsForValue().get(USER_ROOM_PREFIX + userId);
    }

    /** Returns the matched vibe for a room (shown to both users on match) */
    public String getRoomVibe(String roomId) {
        return redisTemplate.opsForValue().get(ROOM_VIBES_PREFIX + roomId);
    }

    public long getQueueSize() {
        Long size = redisTemplate.opsForList().size(GLOBAL_QUEUE);
        return size != null ? size : 0;
    }

    // ── Private ───────────────────────────────────────────────────────────────
    private ChatSessionResponse createMatch(String u1, String u2, String vibe) {
        String roomId = UUID.randomUUID().toString();
        log.info("Matched {} + {} into room {} vibe={}", u1, u2, roomId, vibe);

        redisTemplate.opsForValue().set(USER_ROOM_PREFIX + u1, roomId, sessionTtlSeconds, TimeUnit.SECONDS);
        redisTemplate.opsForValue().set(USER_ROOM_PREFIX + u2, roomId, sessionTtlSeconds, TimeUnit.SECONDS);

        String roomKey = ROOM_USERS_PREFIX + roomId;
        redisTemplate.opsForSet().add(roomKey, u1, u2);
        redisTemplate.expire(roomKey, sessionTtlSeconds, TimeUnit.SECONDS);

        if (vibe != null) {
            redisTemplate.opsForValue().set(ROOM_VIBES_PREFIX + roomId, vibe, sessionTtlSeconds, TimeUnit.SECONDS);
        }

        ChatSession session = ChatSession.builder()
                .roomId(roomId).user1Id(u1).user2Id(u2)
                .status(ChatSession.SessionStatus.ACTIVE)
                .startedAt(Instant.now()).build();
        chatSessionRepository.save(session);

        return ChatSessionResponse.builder()
                .roomId(roomId).status("MATCHED")
                .message(vibe != null ? "Matched on vibe: " + vibe : "Matched!")
                .build();
    }

    private void leaveCurrentRoom(String userId) {
        if (getUserRoom(userId) != null) endSession(userId);
    }
}
