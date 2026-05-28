package com.example.informationexam.service;

import com.example.informationexam.domain.user.User;
import com.example.informationexam.domain.user.UserRepository;
import com.example.informationexam.domain.user.Role;
import com.example.informationexam.config.JwtTokenProvider;
import com.example.informationexam.dto.AuthResponse;
import com.example.informationexam.domain.useranswer.StudySessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

// DEBUG: [Supabase-OAuth-2026-05-27] UserService - Supabase JWT 기반 사용자 관리
// 원인: Google ID Token 직접 검증 → Supabase JWT 검증으로 전환
// 해결: SupabaseTokenVerifierService를 통해 JWT 검증 후 사용자 조회/생성
@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {
    private static final String ADMIN_EMAIL = "okskycar1@gmail.com";

    private final UserRepository userRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final SupabaseTokenVerifierService supabaseTokenVerifierService;
    private final StudySessionRepository studySessionRepository;

    @Transactional
    public AuthResponse loginWithSupabase(String supabaseToken, String traceId) {
        log.info("[AUTH][{}][STEP1] Supabase JWT 검증 시작", traceId);

        String email;
        String googleId;
        String name;
        
        try {
            // Supabase JWT에서 이메일 추출
            email = supabaseTokenVerifierService.getEmail(supabaseToken);
            // Supabase JWT의 subject를 googleId로 사용
            googleId = extractSubjectFromToken(supabaseToken);
            name = email.split("@")[0]; // 이메일에서 이름 추출
            log.info("[AUTH][{}][STEP1] Supabase JWT 검증 완료 - email: {}", traceId, email);
        } catch (Exception e) {
            log.error("[AUTH][{}][STEP1][FAIL] Supabase JWT 검증 실패: {}", traceId, e.getMessage());
            throw new IllegalArgumentException("Supabase token verification failed: " + e.getMessage());
        }

        log.info("[AUTH][{}][STEP2] 사용자 조회 시작 - googleId: {}", traceId, googleId);

        // 1. googleId로 사용자 조회 (우선)
        Optional<User> existingUser = userRepository.findByGoogleId(googleId);
        final User[] userHolder = new User[1];
        boolean[] isNewUser = {false};

        // 2. googleId로 찾지 못한 경우, email로 조회 후 googleId 연결 (보조)
        if (existingUser.isEmpty()) {
            log.info("[AUTH][{}][STEP2][FALLBACK] googleId 미발견, email로 조회: {}", traceId, email);
            Optional<User> userByEmail = userRepository.findByEmail(email);

            if (userByEmail.isPresent()) {
                User foundUser = userByEmail.get();
                if (foundUser.getGoogleId() == null || foundUser.getGoogleId().isBlank()) {
                    foundUser.updateGoogleId(googleId);
                    userRepository.save(foundUser);
                    log.info("[AUTH][{}][STEP2][LINKED] 기존 사용자 googleId 연결 - id: {}, email: {}",
                            traceId, foundUser.getId(), foundUser.getEmail());
                } else {
                    log.warn("[AUTH][{}][STEP2][CONFLICT] 이메일이 다른 Google 계정에 연결됨", traceId);
                    throw new IllegalArgumentException("이 이메일은 이미 다른 Google 계정에 연결되어 있습니다.");
                }
                existingUser = Optional.of(foundUser);
            }
        }

        // 3. 기존 사용자 또는 신규 사용자 생성
        if (existingUser.isPresent()) {
            userHolder[0] = existingUser.get();
            log.info("[AUTH][{}][STEP2][EXISTING] 기존 사용자 - id: {}, email: {}, username: {}",
                    traceId, userHolder[0].getId(), userHolder[0].getEmail(), userHolder[0].getUsername());
        } else {
            String role = resolveRole(email);
            log.info("[AUTH][{}][STEP2][NEW] 신규 사용자 생성 - email: {}, role: {}", traceId, email, role);

            User newUser = User.builder()
                    .googleId(googleId)
                    .email(email)
                    .username(generateUsername(email))
                    .nickname(name != null ? name : email.split("@")[0])
                    .role(role)
                    .build();
            userHolder[0] = userRepository.save(newUser);
            isNewUser[0] = true;

            log.info("[AUTH][{}][STEP2][NEW][SAVED] 신규 사용자 생성 완료 - id: {}, email: {}, username: {}, role: {}",
                    traceId, userHolder[0].getId(), userHolder[0].getEmail(), userHolder[0].getUsername(), role);
        }

        User user = userHolder[0];

        // 4. 사용자별 세션 조회 또는 생성
        com.example.informationexam.domain.useranswer.StudySession studySession = studySessionRepository.findByUserId(user.getId())
                .orElseGet(() -> new com.example.informationexam.domain.useranswer.StudySession(googleId, user.getId()));
        studySessionRepository.save(studySession);

        log.info("[AUTH][{}][STEP3] JWT 토큰 생성", traceId);
        String token = jwtTokenProvider.createToken(user.getUsername());

        log.info("[AUTH][{}][STEP3] 트라이얼 상태 확인", traceId);
        boolean trialExpired = isTrialExpired(user);
        boolean requiresPayment = trialExpired && !Role.MONEY_USER.getKey().equals(user.getRole());
        boolean canAccessApp = Role.ADMIN.getKey().equals(user.getRole()) || !requiresPayment;
        boolean isAdmin = Role.ADMIN.getKey().equals(user.getRole());

        log.info("[AUTH][{}][STEP5] 응답 생성 - isAdmin: {}, trialExpired: {}, canAccessApp: {}",
                traceId, isAdmin, trialExpired, canAccessApp);

        return AuthResponse.builder()
                .token(token)
                .username(user.getUsername())
                .nickname(user.getNickname())
                .email(user.getEmail())
                .role(user.getRole())
                .isAdmin(isAdmin)
                .trialExpired(trialExpired)
                .requiresPayment(requiresPayment)
                .canAccessApp(canAccessApp)
                .paymentMessage(requiresPayment ? "무료 이용 기간이 만료되었습니다. 결제 후 계속 이용하세요." : null)
                .isNewUser(isNewUser[0])
                .requiresNickname(isNewUser[0] && (user.getNickname() == null || user.getNickname().isEmpty()))
                .userId(user.getId())
                .build();
    }

    // DEBUG: [Supabase-OAuth-2026-05-27] Supabase JWT에서 subject 추출
    // 원인: JWT의 'sub' claim을 googleId로 사용
    private String extractSubjectFromToken(String token) {
        // JWT payload에서 subject 추출 (간단한 파싱)
        try {
            String[] parts = token.split("\\.");
            if (parts.length >= 2) {
                String payload = new String(java.util.Base64.getUrlDecoder().decode(parts[1]));
                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                java.util.Map<String, Object> claims = mapper.readValue(payload, java.util.Map.class);
                String subject = (String) claims.get("sub");
                if (subject != null && !subject.isBlank()) {
                    return subject;
                }
            }
        } catch (Exception e) {
            log.warn("[Supabase-OAuth] JWT subject 추출 실패, 이메일 기반 ID 사용: {}", e.getMessage());
        }
        // fallback: 이메일 기반 해시 사용
        return "supabase_" + java.util.UUID.randomUUID().toString().substring(0, 8);
    }

    private String resolveRole(String email) {
        if (ADMIN_EMAIL.equalsIgnoreCase(email)) {
            log.info("[AUTH][ROLE] 관리자 계정 감지: {}", email);
            return Role.ADMIN.getKey();
        }
        return Role.FREE_USER.getKey();
    }

    public boolean isTrialExpired(User user) {
        if (user == null) {
            return false;
        }
        if (Role.ADMIN.getKey().equals(user.getRole())) {
            return false;
        }
        if (user.getTrialExpiresAt() == null) {
            return false;
        }
        return LocalDateTime.now().isAfter(user.getTrialExpiresAt());
    }

    private String generateUsername(String email) {
        return email.split("@")[0] + "_" + System.currentTimeMillis();
    }

    public User getUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다: " + username));
    }

    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다: " + email));
    }

    public User setNickname(String username, String nickname) {
        User user = getUserByUsername(username);
        user.updateNickname(nickname);
        return userRepository.save(user);
    }

    // DEBUG: [JWT-2026-05-28] 토큰 갱신 메서드 추가
    // 원인: 12시간 유효기간 만료 전 자동 갱신을 위해 토큰 재발급 필요
    // 해결: 기존 토큰 검증 후 새로운 토큰 발급
    @Transactional
    public String refreshToken(String token, String traceId) {
        log.info("[AUTH][{}][REFRESH][STEP1] 토큰 검증 시작", traceId);
        
        // 토큰 유효성 검증
        if (!jwtTokenProvider.validateToken(token)) {
            log.error("[AUTH][{}][REFRESH][FAIL] 유효하지 않은 토큰", traceId);
            throw new IllegalArgumentException("Invalid token");
        }

        // 토큰에서 사용자명 추출
        String username = jwtTokenProvider.getUsername(token);
        log.info("[AUTH][{}][REFRESH][STEP2] 토큰에서 사용자명 추출: {}", traceId, username);

        // 사용자 조회
        User user = getUserByUsername(username);
        log.info("[AUTH][{}][REFRESH][STEP3] 사용자 조회 완료 - id: {}, email: {}", traceId, user.getId(), user.getEmail());

        // 새로운 토큰 발급
        String newToken = jwtTokenProvider.createToken(user.getUsername());
        log.info("[AUTH][{}][REFRESH][STEP4] 새로운 토큰 발급 완료", traceId);

        return newToken;
    }
}
