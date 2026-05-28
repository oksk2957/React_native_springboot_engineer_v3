package com.example.informationexam.controller;

import com.example.informationexam.dto.AuthResponse;
import com.example.informationexam.service.UserService;
import com.example.informationexam.service.SupabaseTokenVerifierService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

// DEBUG: [Supabase-OAuth-2026-05-27] GoogleAuthController - Supabase OAuth 전환
// 원인: Google ID Token 직접 검증 → Supabase JWT 검증으로 전환
// 해결: /api/auth/google 엔드포인트에서 Supabase JWT를 받아 검증
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
public class GoogleAuthController {

    private final UserService userService;
    private final SupabaseTokenVerifierService supabaseTokenVerifierService;

    /**
     * POST /api/auth/google
     * Supabase JWT를 받아 백엔드 JWT를 발급합니다.
     * 
     * Request Body: { "idToken": "Supabase JWT Token" }
     * Response (성공): { "success": true, "data": {...} }
     * Response (실패): { "success": false, "error": { "code": "...", "message": "..." } }
     */
    @PostMapping("/google")
    public ResponseEntity<Map<String, Object>> googleAuth(@RequestBody Map<String, String> request) {
        long start = System.currentTimeMillis();
        String traceId = UUID.randomUUID().toString().substring(0, 8);

        log.info("[AUTH][{}][POST][START] Supabase OAuth login request received", traceId);

        // 입력 검증: idToken 필수
        String idToken = request.get("idToken");
        if (idToken == null || idToken.isEmpty()) {
            log.warn("[AUTH][{}][POST][FAIL] idToken is empty or null", traceId);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", Map.of("code", "INVALID_REQUEST", "message", "Supabase JWT Token is required")
            ));
        }

        try {
            // Supabase JWT 검증 및 사용자 조회/생성 후 JWT 발급
            AuthResponse authResponse = userService.loginWithSupabase(idToken, traceId);
            
            long duration = System.currentTimeMillis() - start;
            log.info("[AUTH][{}][POST][END] Supabase OAuth login completed in {} ms", traceId, duration);
            
            // 성공 응답 표준화
            return ResponseEntity.ok(Map.of("success", true, "data", authResponse));

        } catch (IllegalArgumentException e) {
            long duration = System.currentTimeMillis() - start;
            log.error("[AUTH][{}][POST][FAIL] Invalid Supabase JWT token after {} ms: {}", 
                    traceId, duration, e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "success", false,
                    "error", Map.of("code", "INVALID_TOKEN", "message", "Invalid Supabase JWT token: " + e.getMessage())
            ));
        } catch (Exception e) {
            long duration = System.currentTimeMillis() - start;
            log.error("[AUTH][{}][POST][FAIL] Supabase OAuth login failed after {} ms", traceId, duration, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "success", false,
                    "error", Map.of("code", "AUTH_FAILED", "message", "Authentication failed: " + e.getMessage())
            ));
        }
    }

    /**
     * OPTIONS /api/auth/google
     * CORS 프리플라이트 요청 처리
     */
    @RequestMapping(value = "/google", method = RequestMethod.OPTIONS)
    public ResponseEntity<Void> googleAuthOptions() {
        String traceId = UUID.randomUUID().toString().substring(0, 8);
        log.info("[AUTH][{}][OPTIONS] CORS preflight request received", traceId);
        return ResponseEntity.ok().build();
    }

    /**
     * POST /api/auth/refresh
     * JWT 토큰 갱신 엔드포인트
     * Request Body: { "token": "현재 JWT 토큰" }
     * Response: { "success": true, "data": { "token": "새로운 JWT 토큰" } }
     * 
     * DEBUG: [JWT-2026-05-28] 토큰 갱신 엔드포인트 추가
     * 원인: 12시간 유효기간 만료 전 자동 갱신을 위해 토큰 재발급 필요
     * 해결: 기존 토큰 검증 후 새로운 토큰 발급
     */
    @PostMapping("/refresh")
    public ResponseEntity<Map<String, Object>> refreshToken(@RequestBody Map<String, String> request) {
        String traceId = UUID.randomUUID().toString().substring(0, 8);
        long start = System.currentTimeMillis();

        log.info("[AUTH][{}][REFRESH][START] token refresh request received", traceId);

        String token = request.get("token");
        if (token == null || token.isEmpty()) {
            log.warn("[AUTH][{}][REFRESH][FAIL] token is empty or null", traceId);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", Map.of("code", "INVALID_REQUEST", "message", "Token is required")
            ));
        }

        try {
            // 토큰 갱신
            String newToken = userService.refreshToken(token, traceId);
            long duration = System.currentTimeMillis() - start;
            log.info("[AUTH][{}][REFRESH][END] token refreshed in {} ms", traceId, duration);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "data", Map.of("token", newToken)
            ));
        } catch (Exception e) {
            long duration = System.currentTimeMillis() - start;
            log.error("[AUTH][{}][REFRESH][FAIL] token refresh failed after {} ms", traceId, duration, e);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                    "success", false,
                    "error", Map.of("code", "REFRESH_FAILED", "message", "Token refresh failed: " + e.getMessage())
            ));
        }
    }

    /**
     * GET /api/auth/verify
     * 백엔드 JWT 검증 엔드포인트
     * Response: { "success": true, "data": { "valid": true/false, "user": {...} } }
     */
    @GetMapping("/verify")
    public ResponseEntity<Map<String, Object>> verifyToken(@RequestHeader("Authorization") String authHeader) {
        String traceId = UUID.randomUUID().toString().substring(0, 8);
        long start = System.currentTimeMillis();

        log.info("[AUTH][{}][VERIFY][START] token verification request received", traceId);

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            log.warn("[AUTH][{}][VERIFY][FAIL] No token provided", traceId);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", Map.of("code", "INVALID_REQUEST", "message", "No token provided")
            ));
        }

        String token = authHeader.substring(7);

        try {
            // Supabase JWT 검증
            String email = supabaseTokenVerifierService.getEmail(token);
            var user = userService.getUserByEmail(email);
            long duration = System.currentTimeMillis() - start;

            log.info("[AUTH][{}][VERIFY][END] token valid, user loaded in {} ms", traceId, duration);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "data", Map.of(
                            "valid", true,
                            "user", Map.of(
                                    "id", user.getId(),
                                    "username", user.getUsername(),
                                    "email", user.getEmail(),
                                    "nickname", user.getNickname(),
                                    "role", user.getRole()
                            )
                    )
            ));
        } catch (Exception e) {
            long duration = System.currentTimeMillis() - start;
            log.error("[AUTH][{}][VERIFY][FAIL] Token verification failed after {} ms", traceId, duration, e);
            return ResponseEntity.ok(Map.of("success", true, "data", Map.of("valid", false)));
        }
    }
}
