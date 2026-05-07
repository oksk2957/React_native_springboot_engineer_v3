package com.example.informationexam.controller;

import com.example.informationexam.service.GoogleTokenVerifierService;
import com.example.informationexam.service.UserService;
import com.example.informationexam.config.JwtTokenProvider;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
public class GoogleAuthController {

    private final UserService userService;
    private final JwtTokenProvider jwtTokenProvider;
    private final GoogleTokenVerifierService googleTokenVerifierService;

    /**
     * Google ID Token 검증 후 사용자 로그인/회원가입
     */
    @PostMapping("/google")
    public ResponseEntity<Map<String, Object>> googleAuth(@RequestBody Map<String, String> request) {
        String idToken = request.get("idToken");
        
        if (idToken == null || idToken.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "ID token is required"));
        }

        try {
            // Google 공식 라이브러리를 사용한 ID Token 검증
            GoogleIdToken.Payload payload = googleTokenVerifierService.verifyGoogleIdToken(idToken);

            String googleId = payload.getSubject();
            String email = payload.getEmail();
            String name = (String) payload.get("name");
            String pictureUrl = (String) payload.get("picture");

            log.info("Google login attempt - email: {}, name: {}", email, name);

            // 사용자 로그인/회원가입 (UserService에서 처리)
            Map<String, Object> authResult = userService.loginWithGoogle(googleId, email, name);
            
            // 응답 구성
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("token", authResult.get("token"));
            response.put("requiresNickname", authResult.get("requiresNickname"));
            response.put("user", Map.of(
                    "id", ((com.example.informationexam.domain.user.User) authResult.get("user")).getId(),
                    "email", email,
                    "username", ((com.example.informationexam.domain.user.User) authResult.get("user")).getUsername(),
                    "nickname", ((com.example.informationexam.domain.user.User) authResult.get("user")).getNickname(),
                    "role", ((com.example.informationexam.domain.user.User) authResult.get("user")).getRole(),
                    "pictureUrl", pictureUrl
            ));

            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            log.warn("Invalid Google ID token: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid ID token: " + e.getMessage()));
        } catch (Exception e) {
            log.error("Google token verification failed", e);
            return ResponseEntity.status(500).body(Map.of("error", "Token verification failed: " + e.getMessage()));
        }
    }

    /**
     * 토큰 유효성 검증 (애플리케이션 자체 JWT 토큰용)
     */
    @GetMapping("/verify")
    public ResponseEntity<Map<String, Object>> verifyToken(@RequestHeader("Authorization") String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.badRequest().body(Map.of("valid", false, "error", "No token provided"));
        }

        String token = authHeader.substring(7);
        
        try {
            if (jwtTokenProvider.validateToken(token)) {
                String username = jwtTokenProvider.getUsername(token);
                var user = userService.getUserByUsername(username);
                
                return ResponseEntity.ok(Map.of(
                        "valid", true,
                        "user", Map.of(
                                "id", user.getId(),
                                "username", user.getUsername(),
                                "email", user.getEmail(),
                                "nickname", user.getNickname(),
                                "role", user.getRole()
                        )
                ));
            }
        } catch (Exception e) {
            log.error("Token verification failed", e);
        }
        
        return ResponseEntity.ok(Map.of("valid", false));
    }
}
