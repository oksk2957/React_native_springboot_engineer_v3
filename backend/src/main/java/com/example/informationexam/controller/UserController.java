package com.example.informationexam.controller;

import com.example.informationexam.config.JwtTokenProvider;
import com.example.informationexam.domain.user.User;
import com.example.informationexam.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.HashMap;

// DEBUG: [AI-AUTHOR-2026-06-09-#73] /users/me 3가지 버그 수정
// 1. @RequestMapping: "/api/auth" → "/api" (프론트 api.ts:226이 /api/users/me 호출 → /api로 맞춤)
//    → setNickname도 동일하게 /api/users/nickname으로 자동 매핑 (프론트 api.ts:221 경로 일치)
// 2. JwtTokenProvider: new → Spring DI 주입 (@Value null NPE 방지)
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Slf4j
public class UserController {
    private final UserService userService;
    private final JwtTokenProvider jwtTokenProvider;

    // DEBUG: [AI-AUTHOR-2026-06-09-#73] /users/me 엔드포인트 수정
    // 기존: new JwtTokenProvider() → NPE (jwt.secret @Value null)
    // 수정: DI 주입받은 jwtTokenProvider 사용
    @GetMapping("/users/me")
    public ResponseEntity<?> getCurrentUser(@RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.replace("Bearer ", "");
            String username = jwtTokenProvider.getUsername(token);

            User user = userService.getUserByUsername(username);

            // 민감 정보 제외하고 필요한 필드만 반환
            Map<String, Object> response = new HashMap<>();
            response.put("id", user.getId());
            response.put("username", user.getUsername());
            response.put("nickname", user.getNickname());
            response.put("role", user.getRole());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("[/users/me] Error getting current user: {}", e.getMessage());
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
    }

    // DEBUG: [AI-AUTHOR-2026-06-09-#73] setNickname 경로 변경
    // 기존: "/users/nickname" → @RequestMapping "/api"와 합쳐지면 "/api/users/nickname"
    // 프론트 api.ts:221은 /users/nickname 호출 → baseURL /api와 합쳐지면 /api/users/nickname → 일치
    @PostMapping("/users/nickname")
    public ResponseEntity<User> setNickname(@RequestBody Map<String, String> request,
            @RequestHeader("Authorization") String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        String username = jwtTokenProvider.getUsername(token);

        User updatedUser = userService.setNickname(username, request.get("nickname"));

        System.out.println("Nickname set for user: " + username + " to " + request.get("nickname"));

        return ResponseEntity.ok(updatedUser);
    }
}
