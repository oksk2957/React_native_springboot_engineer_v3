package com.example.informationexam.controller;

import com.example.informationexam.dto.AuthResponse;
import com.example.informationexam.service.GoogleTokenVerifierService;
import com.example.informationexam.service.UserService;
import com.example.informationexam.config.JwtTokenProvider;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
public class GoogleAuthController {

    private final UserService userService;
    private final JwtTokenProvider jwtTokenProvider;
    private final GoogleTokenVerifierService googleTokenVerifierService;

    /**
     * POST /api/auth/google
     * Google ID Token을 받아 백엔드 JWT를 발급합니다.
     * CORS/OPTIONS 프리플라이트 지원을 위해AllowedOrigins 설정 필요
     */
    @PostMapping("/google")
    public ResponseEntity<AuthResponse> googleAuth(@RequestBody Map<String, String> request) {
        long start = System.currentTimeMillis();
        String traceId = UUID.randomUUID().toString().substring(0, 8);

        log.info("[AUTH][{}][POST][START] google login request received", traceId);

        // 입력 검증: idToken 필수
        String idToken = request.get("idToken");
        if (idToken == null || idToken.isEmpty()) {
            log.warn("[AUTH][{}][POST][FAIL] idToken is empty or null", traceId);
            return ResponseEntity.badRequest().body(AuthResponse.builder()
                    .canAccessApp(false)
                    .requiresPayment(false)
                    .paymentMessage("Google ID Token is required")
                    .build());
        }

        try {
            // Google ID Token 검증 및 사용자 조회/생성 후 JWT 발급
            AuthResponse authResponse = userService.loginWithGoogle(idToken, traceId);
            
            long duration = System.currentTimeMillis() - start;
            log.info("[AUTH][{}][POST][END] google login completed in {} ms", traceId, duration);
            
            return ResponseEntity.ok(authResponse);

        } catch (IllegalArgumentException e) {
            // 잘못된 토큰 (만료, 서명 오류 등)
            long duration = System.currentTimeMillis() - start;
            log.error("[AUTH][{}][POST][FAIL] Invalid Google ID token after {} ms: {}", 
                    traceId, duration, e.getMessage());
            return ResponseEntity.badRequest().body(AuthResponse.builder()
                    .canAccessApp(false)
                    .requiresPayment(false)
                    .paymentMessage("Invalid Google ID token: " + e.getMessage())
                    .build());
        } catch (Exception e) {
            // 기타 서버 오류
            long duration = System.currentTimeMillis() - start;
            log.error("[AUTH][{}][POST][FAIL] Google login failed after {} ms", traceId, duration, e);
            return ResponseEntity.status(500).body(AuthResponse.builder()
                    .canAccessApp(false)
                    .requiresPayment(false)
                    .paymentMessage("Token verification failed: " + e.getMessage())
                    .build());
        }
    }

    /**
     * OPTIONS /api/auth/google
     * CORS 프리플라이트 요청 처리
     * (SecurityConfig에서 이미 모든 Origins 허용하도록 구성됨)
     */
    @RequestMapping(value = "/google", method = RequestMethod.OPTIONS)
    public ResponseEntity<Void> googleAuthOptions() {
        String traceId = UUID.randomUUID().toString().substring(0, 8);
        log.info("[AUTH][{}][OPTIONS] CORS preflight request received", traceId);
        return ResponseEntity.ok().build();
    }

    /**
     * GET /api/auth/verify
     * 백엔드 JWT 검증 엔드포인트
     */
    @GetMapping("/verify")
    public ResponseEntity<Map<String, Object>> verifyToken(@RequestHeader("Authorization") String authHeader) {
        String traceId = UUID.randomUUID().toString().substring(0, 8);
        long start = System.currentTimeMillis();

        log.info("[AUTH][{}][VERIFY][START] token verification request received", traceId);

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            log.warn("[AUTH][{}][VERIFY][FAIL] No token provided", traceId);
            return ResponseEntity.badRequest().body(Map.of("valid", false, "error", "No token provided"));
        }

        String token = authHeader.substring(7);

        try {
            if (jwtTokenProvider.validateToken(token)) {
                String username = jwtTokenProvider.getUsername(token);
                var user = userService.getUserByUsername(username);
                long duration = System.currentTimeMillis() - start;

                log.info("[AUTH][{}][VERIFY][END] token valid, user loaded in {} ms", traceId, duration);

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
            long duration = System.currentTimeMillis() - start;
            log.error("[AUTH][{}][VERIFY][FAIL] Token verification failed after {} ms", traceId, duration, e);
        }

        return ResponseEntity.ok(Map.of("valid", false));
    }
}