package com.example.informationexam.controller;

import com.example.informationexam.config.JwtTokenProvider;
import com.example.informationexam.domain.user.User;
import com.example.informationexam.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class CurrentUserController {

    private final JwtTokenProvider jwtTokenProvider;
    private final UserService userService;

    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> getCurrentUser(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        if (authHeader == null || authHeader.isBlank()) {
            return ResponseEntity.status(401).body(Map.of(
                    "error", true,
                    "message", "Authorization 헤더가 필요합니다."
            ));
        }

        if (!authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).body(Map.of(
                    "error", true,
                    "message", "Bearer 형식의 토큰이 필요합니다."
            ));
        }

        try {
            String token = authHeader.substring(7).trim();
            String username = jwtTokenProvider.getUsername(token);
            User user = userService.getUserByUsername(username);

            return ResponseEntity.ok(Map.of(
                    "id", user.getId(),
                    "email", user.getEmail(),
                    "username", user.getUsername(),
                    "nickname", user.getNickname(),
                    "role", user.getRole(),
                    "googleId", user.getGoogleId()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(401).body(Map.of(
                    "error", true,
                    "message", "유효하지 않은 토큰입니다: " + e.getMessage()
            ));
        }
    }
}
