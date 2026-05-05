package com.example.informationexam.controller;

import com.example.informationexam.service.UserService;
import com.example.informationexam.config.JwtTokenProvider;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
public class GoogleAuthController {

    private final UserService userService;
    private final JwtTokenProvider jwtTokenProvider;

    @Value("${spring.security.oauth2.client.registration.google.client-id}")
    private String googleClientId;

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
            // Google ID Token 검증 (JWT 파싱)
            Claims claims = Jwts.parser()
                    .verifyWith(jwtTokenProvider.getSigningKeyForGoogle())
                    .build()
                    .parseSignedClaims(idToken)
                    .getPayload();

            // audience 검증
            String audience = claims.getAudience().toString();
            if (!audience.contains(googleClientId)) {
                log.warn("Invalid audience in Google ID token");
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid ID token audience"));
            }
            
            // issuer 검증
            String issuer = claims.getIssuer();
            if (issuer == null || !issuer.contains("accounts.google.com")) {
                log.warn("Invalid issuer in Google ID token: {}", issuer);
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid ID token issuer"));
            }

            String googleId = claims.getSubject();
            String email = claims.get("email", String.class);
            String name = claims.get("name", String.class);
            String pictureUrl = claims.get("picture", String.class);

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

        } catch (Exception e) {
            log.error("Google token verification failed", e);
            return ResponseEntity.status(500).body(Map.of("error", "Token verification failed: " + e.getMessage()));
        }
    }

    /**
     * 토큰 유효성 검증
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