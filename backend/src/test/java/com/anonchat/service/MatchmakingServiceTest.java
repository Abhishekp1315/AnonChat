package com.anonchat.service;

import com.anonchat.dto.ChatSessionResponse;
import com.anonchat.model.ChatSession;
import com.anonchat.repository.ChatSessionRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.*;

import java.util.Optional;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MatchmakingServiceTest {

    @Mock private RedisTemplate<String, String> redisTemplate;
    @Mock private ListOperations<String, String> listOps;
    @Mock private ValueOperations<String, String> valueOps;
    @Mock private SetOperations<String, String> setOps;
    @Mock private ChatSessionRepository chatSessionRepository;

    @InjectMocks
    private MatchmakingService matchmakingService;

    @Test
    void joinQueue_noWaitingUser_returnsWaiting() {
        when(redisTemplate.opsForList()).thenReturn(listOps);
        when(redisTemplate.opsForValue()).thenReturn(valueOps);
        when(valueOps.get("user:room:user-1")).thenReturn(null);
        when(listOps.leftPop("chat:queue:global")).thenReturn(null);

        ChatSessionResponse response = matchmakingService.joinQueue("user-1", null);

        assertThat(response.getStatus()).isEqualTo("WAITING");
        verify(listOps).rightPush("chat:queue:global", "user-1");
    }

    @Test
    void joinQueue_waitingUserExists_returnsMatched() {
        when(redisTemplate.opsForList()).thenReturn(listOps);
        when(redisTemplate.opsForValue()).thenReturn(valueOps);
        when(redisTemplate.opsForSet()).thenReturn(setOps);
        when(valueOps.get("user:room:user-2")).thenReturn(null);
        when(listOps.leftPop("chat:queue:global")).thenReturn("user-1");
        when(chatSessionRepository.save(any(ChatSession.class))).thenAnswer(i -> i.getArgument(0));

        ChatSessionResponse response = matchmakingService.joinQueue("user-2", null);

        assertThat(response.getStatus()).isEqualTo("MATCHED");
        assertThat(response.getRoomId()).isNotNull();
    }

    @Test
    void endSession_userNotInRoom_returnsEnded() {
        when(redisTemplate.opsForValue()).thenReturn(valueOps);
        when(redisTemplate.opsForList()).thenReturn(listOps);
        when(valueOps.get("user:room:user-1")).thenReturn(null);

        ChatSessionResponse response = matchmakingService.endSession("user-1");

        assertThat(response.getStatus()).isEqualTo("ENDED");
    }
}
