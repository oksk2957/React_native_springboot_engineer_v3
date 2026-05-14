package com.example.informationexam.controller;

import com.example.informationexam.config.JwtTokenProvider;
import com.example.informationexam.domain.user.User;
import com.example.informationexam.service.GoogleTokenVerifierService;
import com.example.informationexam.service.UserService;
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

    @PostMapping("/google")
    public ResponseEntity<Map<String, Object>> googleAuth(@RequestBody Map<String, String> request) {
        String token = request != null ? firstNonBlank(request.get("idToken"), request.get("access_token"), request.get("token")) : null;
        return processGoogleLogin(token);
    }

    @GetMapping("/google")
    public ResponseEntity<Map<String, Object>> googleAuthRedirect(@RequestParam(required = false) String access_token) {
        if (access_token != null && !access_token.isBlank()) {
            return processGoogleLogin(access_token);
        }
        return ResponseEntity.badRequest().body(Map.of("error", "Access token is missing in redirect"));
    }

    private ResponseEntity<Map<String, Object>> processGoogleLogin(String idToken) {
        if (idToken == null || idToken.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "ID token is required"));
        }

        try {
            GoogleIdToken.Payload payload = googleTokenVerifierService.verifyGoogleIdToken(idToken);
            String googleId = payload.getSubject();
            String email = payload.getEmail();
            String name = (String) payload.get("name");
            String pictureUrl = (String) payload.get("picture");

            log.info("Google login attempt - email: {}, name: {}", email, name);

            Map<String, Object> authResult = userService.loginWithGoogle(googleId, email, name);
            User user = (User) authResult.get("user");

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("token", authResult.get("token"));
            response.put("requiresNickname", authResult.get("requiresNickname"));
            response.put("user", Map.of(
                    "id", user.getId(),
                    "email", email,
                    "username", user.getUsername(),
                    "nickname", user.getNickname(),
                    "role", user.getRole(),
                    "pictureUrl", pictureUrl
            ));

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.warn("Invalid Google ID token: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid ID token: " + e.getMessage()));
        } catch (IllegalStateException e) {
            log.error("Google login configuration error: {}", e.getMessage());
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Google token verification failed", e);
            return ResponseEntity.status(500).body(Map.of("error", "Token verification failed: " + e.getMessage()));
        }
    }

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

    private String firstNonBlank(String... values) {
        if (values == null) {
            return null;
        }
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value;
            }
        }
        return null;
    }
}
