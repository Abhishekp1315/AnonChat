package com.anonchat.repository;

import com.anonchat.model.ChatSession;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ChatSessionRepository extends MongoRepository<ChatSession, String> {
    Optional<ChatSession> findByRoomId(String roomId);
    Optional<ChatSession> findByRoomIdAndStatus(String roomId, ChatSession.SessionStatus status);
}
