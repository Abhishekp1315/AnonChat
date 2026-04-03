package com.anonchat.controller;

import com.anonchat.dto.*;
import com.anonchat.model.ChatMessage;
import com.anonchat.service.ChatService;
import com.anonchat.service.MatchmakingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
@Tag(name = "Chat", description = "Matchmaking and session management")
public class ChatController {

    private final MatchmakingService matchmakingService;
    private final ChatService chatService;

    @PostMapping("/start")
    @Operation(summary = "Join matchmaking queue")
    public ApiResponse<ChatSessionResponse> start(@Valid @RequestBody ChatStartRequest request) {
        log.info("POST /api/chat/start userId={} vibe={}", request.getUserId(), request.getVibe());
        ChatSessionResponse response = matchmakingService.joinQueue(request.getUserId(), request.getVibe());
        if ("MATCHED".equals(response.getStatus())) {
            String vibe = matchmakingService.getRoomVibe(response.getRoomId());
            String msg = vibe != null
                    ? "Matched on vibe: " + vibe + " — say hi!"
                    : "A new chat has started. Say hi!";
            chatService.sendSystemMessage(response.getRoomId(), msg);
        }
        return ApiResponse.ok(response);
    }

    @PostMapping("/next")
    @Operation(summary = "Skip to next user")
    public ApiResponse<ChatSessionResponse> next(@Valid @RequestBody ChatStartRequest request) {
        log.info("POST /api/chat/next userId={}", request.getUserId());
        ChatSessionResponse response = matchmakingService.nextUser(request.getUserId());
        if ("MATCHED".equals(response.getStatus())) {
            chatService.sendSystemMessage(response.getRoomId(), "A new chat has started. Say hi!");
        }
        return ApiResponse.ok(response);
    }

    @PostMapping("/end")
    @Operation(summary = "End chat session")
    public ApiResponse<ChatSessionResponse> end(@Valid @RequestBody ChatStartRequest request) {
        log.info("POST /api/chat/end userId={}", request.getUserId());
        String roomId = matchmakingService.getUserRoom(request.getUserId());
        if (roomId != null) chatService.sendSystemMessage(roomId, "Your chat partner has disconnected.");
        return ApiResponse.ok(matchmakingService.endSession(request.getUserId()));
    }

    @PostMapping("/rate")
    @Operation(summary = "Submit post-chat rating")
    public ApiResponse<Void> rate(@Valid @RequestBody RatingRequest request) {
        matchmakingService.submitRating(request.getRoomId(), request.getUserId(), request.getStars());
        return ApiResponse.ok("Rating saved", null);
    }

    @GetMapping("/history/{roomId}")
    @Operation(summary = "Get message history")
    public ApiResponse<List<ChatMessage>> history(@PathVariable String roomId) {
        return ApiResponse.ok(chatService.getHistory(roomId));
    }

    @GetMapping("/status/{userId}")
    @Operation(summary = "Get user chat status")
    public ApiResponse<String> status(@PathVariable String userId) {
        String roomId = matchmakingService.getUserRoom(userId);
        return ApiResponse.ok(roomId != null ? roomId : "NOT_IN_SESSION");
    }

    @GetMapping("/queue/size")
    @Operation(summary = "Get queue size")
    public ApiResponse<Long> queueSize() {
        return ApiResponse.ok(matchmakingService.getQueueSize());
    }

    @GetMapping("/vibe/{roomId}")
    @Operation(summary = "Get matched vibe for a room")
    public ApiResponse<Map<String, String>> roomVibe(@PathVariable String roomId) {
        String vibe = matchmakingService.getRoomVibe(roomId);
        return ApiResponse.ok(Map.of("vibe", vibe != null ? vibe : ""));
    }
}
