package com.example.informationexam.service;

import com.example.informationexam.domain.user.User;
import com.example.informationexam.domain.user.UserRepository;
import com.example.informationexam.domain.user.Role;
import com.example.informationexam.config.JwtTokenProvider;
import com.example.informationexam.dto.AuthResponse;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.example.informationexam.domain.useranswer.StudySessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {
    private static final String ADMIN_EMAIL = "okskycar1@gmail.com";
    private static final int TRIAL_DAYS = 7;

    private final UserRepository userRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final GoogleTokenVerifierService googleTokenVerifierService;
    private final StudySessionRepository studySessionRepository;
    private final StudySessionRepository studySessionRepository;

    @Transactional
    public AuthResponse loginWithGoogle(String idToken, String traceId) {
        log.info("[AUTH][{}][STEP1] token verification start", traceId);

        GoogleIdToken.Payload payload;
        try {
            payload = googleTokenVerifierService.verifyGoogleIdToken(idToken);
        } catch (Exception e) {
            log.error("[AUTH][{}][STEP1][FAIL] token verification failed: {}", traceId, e.getMessage());
            throw new IllegalArgumentException("Google token verification failed: " + e.getMessage());
        }

        String googleId = payload.getSubject();
        String email = payload.getEmail();
        String name = (String) payload.get("name");

        log.info("[AUTH][{}][STEP2] user lookup by googleId: {}", traceId, googleId);

        // 1. googleId로 사용자 조회 (우선)
        Optional<User> existingUser = userRepository.findByGoogleId(googleId);
        User user;
        boolean isNewUser = false;

        // 2. googleId로 찾지 못한 경우, email로 조회 후 googleId 연결 (보조)
        if (existingUser.isEmpty()) {
            log.info("[AUTH][{}][STEP2][FALLBACK] googleId not found, trying email lookup: {}", traceId, email);
            Optional<User> userByEmail = userRepository.findByEmail(email);

            if (userByEmail.isPresent()) {
                // 기존 이메일 계정이 있으면 googleId만 연결
                User foundUser = userByEmail.get();
                if (foundUser.getGoogleId() == null || foundUser.getGoogleId().isBlank()) {
                    foundUser.updateGoogleId(googleId);
                    userRepository.save(foundUser);
                    log.info("[AUTH][{}][STEP2][LINKED] existing user linked with googleId - id: {}, email: {}",
                            traceId, foundUser.getId(), foundUser.getEmail());
                } else {
                    // 이미 다른 googleId가 있는 경우 (중복 계정)
                    log.warn("[AUTH][{}][STEP2][CONFLICT] email already linked to different googleId", traceId);
                    throw new IllegalArgumentException("이 이메일은 이미 다른 Google 계정에 연결되어 있습니다.");
                }
                existingUser = Optional.of(foundUser);
            }
        }

        // 3. 기존 사용자 또는 신규 사용자 생성
        if (existingUser.isPresent()) {
            user = existingUser.get();
            log.info("[AUTH][{}][STEP2][EXISTING] user found - id: {}, email: {}, username: {}",
                    traceId, user.getId(), user.getEmail(), user.getUsername());
        } else {
            // 신규 사용자 생성
            String role = resolveRole(email);
            log.info("[AUTH][{}][STEP2][NEW] creating new user - email: {}, role: {}", traceId, email, role);

            user = User.builder()
                    .googleId(googleId)
                    .email(email)
                    .username(generateUsername(email))
                    .nickname(name != null ? name : email.split("@")[0])
                    .role(role)
                    .build();
            user = userRepository.save(user);
            isNewUser = true;

            log.info("[AUTH][{}][STEP2][NEW][SAVED] user created - id: {}, email: {}, username: {}, role: {}",
                    traceId, user.getId(), user.getEmail(), user.getUsername(), role);
        }

        // 4. 사용자별 세션 조회 또는 생성
        String sessionKey = "google:" + googleId;
        StudySession studySession = studySessionRepository.findByUserId(user.getId())
                .orElseGet(() -> StudySession.builder()
                        .user(user)
                        .sessionKey(sessionKey)
                        .build());
        studySessionRepository.save(studySession);

                log.info("[AUTH][{}][STEP3] generating JWT token", traceId);
        String token = jwtTokenProvider.createToken(user.getUsername());

        log.info("[AUTH][{}][STEP3] checking trial status", traceId);
        boolean trialExpired = isTrialExpired(user);
        boolean requiresPayment = trialExpired && !Role.MONEY_USER.getKey().equals(user.getRole());
        boolean canAccessApp = Role.ADMIN.getKey().equals(user.getRole()) || !requiresPayment;
        boolean isAdmin = Role.ADMIN.getKey().equals(user.getRole());

        log.info("[AUTH][{}][STEP5] building response - isAdmin: {}, trialExpired: {}, canAccessApp: {}",
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
                .isNewUser(isNewUser)
                .requiresNickname(isNewUser && (user.getNickname() == null || user.getNickname().isEmpty()))
                .userId(user.getId())
                .build();
    }

    private String resolveRole(String email) {
        if (ADMIN_EMAIL.equalsIgnoreCase(email)) {
            log.info("[AUTH][ROLE] admin user detected: {}", email);
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
        if (Role.MONEY_USER.getKey().equals(user.getRole())) {
            return false;
        }
        return user.getTrialExpiresAt() != null && user.getTrialExpiresAt().isBefore(LocalDateTime.now());
    }

    @Transactional
    public User setNickname(String username, String nickname) {
        Optional<User> userOptional = userRepository.findByUsername(username);
        if (userOptional.isPresent()) {
            User user = userOptional.get();
            user.updateNickname(nickname);
            return userRepository.save(user);
        } else {
            throw new IllegalArgumentException("사용자를 찾을 수 없습니다.");
        }
    }

    public boolean isUsernameTaken(String username) {
        return userRepository.findByUsername(username).isPresent();
    }

    public User getUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .or(() -> userRepository.findByEmail(username))
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
    }

    public User getUserByGoogleId(String googleId) {
        return userRepository.findByGoogleId(googleId)
                .orElseThrow(() -> new IllegalArgumentException("해당 사용자를 찾을 수 없습니다."));
    }

    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("이메일로 사용자를 찾을 수 없습니다."));
    }

    private String generateUsername(String email) {
        String baseUsername = email.split("@")[0].toLowerCase()
                .replaceAll("[^a-z0-9]", "");

        String username = baseUsername;
        int suffix = 1;

        while (userRepository.findByUsername(username).isPresent()) {
            username = baseUsername + "_" + suffix;
            suffix++;
        }

        return username;
    }

    public java.util.List<User> getAllUsers() {
        return userRepository.findAll();
    }

    @Transactional
    public User updateUserRole(Long userId, String role) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        user.setRole(role);
        return userRepository.save(user);
    }

    public Long generateSessionIdFromUsername(String username) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(username.getBytes(StandardCharsets.UTF_8));
            ByteBuffer buffer = ByteBuffer.wrap(hash);
            // SHA-256 해시의 처음 8바이트를 Long으로 변환하여 사용
            return buffer.getLong();
        } catch (NoSuchAlgorithmException e) {
            log.error("SHA-256 알고리즘을 찾을 수 없습니다. UUID 기반 임시 ID를 생성합니다.", e);
            // 예외 발생 시 대안으로 UUID 기반 임시 ID 생성
            return UUID.randomUUID().getMostSignificantBits() & Long.MAX_VALUE;
        }
    }
}
