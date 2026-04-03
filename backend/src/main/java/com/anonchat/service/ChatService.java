package com.anonchat.service;

import com.anonchat.dto.MessagePayload;
import com.anonchat.exception.BadRequestException;
import com.anonchat.model.ChatMessage;
import com.anonchat.repository.ChatMessageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatService {

    private final SimpMessagingTemplate messagingTemplate;
    private final ChatMessageRepository chatMessageRepository;
    private final MatchmakingService matchmakingService;

    public void processMessage(MessagePayload payload) {
        String type = payload.getType() != null ? payload.getType() : "CHAT";

        // TYPING and READ_RECEIPT don't need room validation strictness — just broadcast
        if ("TYPING".equalsIgnoreCase(type) || "READ_RECEIPT".equalsIgnoreCase(type)) {
            if (payload.getTimestamp() == null) payload.setTimestamp(Instant.now());
            messagingTemplate.convertAndSend("/topic/chat/" + payload.getRoomId(), payload);
            return;
        }

        // REACTION — update the message in MongoDB then broadcast
        if ("REACTION".equalsIgnoreCase(type)) {
            handleReaction(payload);
            return;
        }

        // Validate sender is in the room for CHAT messages
        String userRoom = matchmakingService.getUserRoom(payload.getSenderId());
        if (userRoom == null || !userRoom.equals(payload.getRoomId())) {
            throw new BadRequestException("User is not in the specified room");
        }

        if (payload.getTimestamp() == null) payload.setTimestamp(Instant.now());

        if ("CHAT".equalsIgnoreCase(type)) {
            // Assign a stable ID so the frontend can reference it for reactions/receipts
            String msgId = UUID.randomUUID().toString();
            payload.setId(msgId);

            ChatMessage msg = ChatMessage.builder()
                    .id(msgId)
                    .roomId(payload.getRoomId())
                    .senderId(payload.getSenderId())
                    .message(payload.getMessage())
                    .timestamp(payload.getTimestamp())
                    .type(ChatMessage.MessageType.CHAT)
                    .build();
            chatMessageRepository.save(msg);
        }

        log.debug("Broadcasting type={} to room {}", type, payload.getRoomId());
        messagingTemplate.convertAndSend("/topic/chat/" + payload.getRoomId(), payload);
    }

    private void handleReaction(MessagePayload payload) {
        if (payload.getTargetMessageId() == null || payload.getReaction() == null) return;

        chatMessageRepository.findById(payload.getTargetMessageId()).ifPresent(msg -> {
            // Toggle: if same user already reacted with same emoji, remove it
            String existing = msg.getReactions().get(payload.getReaction());
            if (payload.getSenderId().equals(existing)) {
                msg.getReactions().remove(payload.getReaction());
            } else {
                msg.getReactions().put(payload.getReaction(), payload.getSenderId());
            }
            chatMessageRepository.save(msg);
        });

        if (payload.getTimestamp() == null) payload.setTimestamp(Instant.now());
        messagingTemplate.convertAndSend("/topic/chat/" + payload.getRoomId(), payload);
    }

    public void sendSystemMessage(String roomId, String text) {
        MessagePayload system = new MessagePayload();
        system.setRoomId(roomId);
        system.setSenderId("SYSTEM");
        system.setMessage(text);
        system.setTimestamp(Instant.now());
        system.setType("SYSTEM");
        messagingTemplate.convertAndSend("/topic/chat/" + roomId, system);
    }

    public List<ChatMessage> getHistory(String roomId) {
        return chatMessageRepository.findByRoomIdOrderByTimestampAsc(roomId);
    }
}
