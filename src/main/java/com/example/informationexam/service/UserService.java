package com.example.informationexam.service;

import com.example.informationexam.domain.user.User;
import com.example.informationexam.domain.user.UserRepository;
import com.example.informationexam.domain.user.Role;
import com.example.informationexam.config.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.nio.charset.StandardCharsets;
import java.nio.ByteBuffer;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {
    private final UserRepository userRepository;
    private final JwtTokenProvider jwtTokenProvider;

    @Transactional
    public Map<String, Object> loginWithGoogle(String googleId, String email, String name) {
        Optional<User> byGoogle = userRepository.findByGoogleId(googleId);

        User user;
        boolean isNewUser = false;

        if (byGoogle.isPresent()) {
            user = byGoogle.get();
            log.info("Existing user login (google_id) - id: {}, email: {}, username: {}",
                    user.getId(), user.getEmail(), user.getUsername());
        } else {
            Optional<User> byEmail = userRepository.findByEmail(email);
            if (byEmail.isPresent()) {
                user = byEmail.get();
                if (user.getGoogleId() == null || user.getGoogleId().isBlank()) {
                    user.setGoogleId(googleId);
                    user = userRepository.save(user);
                    log.info("Linked google_id to existing email user - id: {}", user.getId());
                } else if (!googleId.equals(user.getGoogleId())) {
                    log.warn("Email match but google_id mismatch for user id={} — keeping existing google_id",
                            user.getId());
                }
                log.info("Existing user login (email) - id: {}, email: {}, username: {}",
                        user.getId(), user.getEmail(), user.getUsername());
            } else {
                user = User.builder()
                        .googleId(googleId)
                        .email(email)
                        .username(generateUsername(email))
                        .nickname(name != null ? name : email.split("@")[0])
                        .role(Role.FREE_USER.getKey())
                        .build();
                user = userRepository.save(user);
                isNewUser = true;
                log.info("New user registered - id: {}, email: {}, username: {}",
                        user.getId(), user.getEmail(), user.getUsername());
            }
        }

        // JWT 토큰 생성
        String token = jwtTokenProvider.createToken(user.getUsername());

        // 결과 반환
        Map<String, Object> result = new HashMap<>();
        result.put("user", user);
        result.put("token", token);
        result.put("isNewUser", isNewUser);
        result.put("requiresNickname", isNewUser && (user.getNickname() == null || user.getNickname().isEmpty()));

        return result;
    }

    /**
     * 별명 설정
     */
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

    /**
     * 사용자명 중복 체크
     */
    public boolean isUsernameTaken(String username) {
        return userRepository.findByUsername(username).isPresent();
    }

    /**
     * 사용자 조회 by username
     */
    public User getUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .or(() -> userRepository.findByEmail(username))
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
    }

    /**
     * 사용자 조회 by googleId
     */
    public User getUserByGoogleId(String googleId) {
        return userRepository.findByGoogleId(googleId)
                .orElseThrow(() -> new IllegalArgumentException("구글로그인 사용자를 찾을 수 없습니다."));
    }

    /**
     * 사용자 조회 by email
     */
    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("이메일로 사용자를 찾을 수 없습니다."));
    }

    /**
     * 사용자명 생성
     * - email@domain.com -> email 형식
     * - 중복 시 email_1, email_2 형식으로 suffix 추가
     */
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

    /**
     * 전체 사용자 목록 조회 (관리자용)
     */
    public java.util.List<User> getAllUsers() {
        return userRepository.findAll();
    }

    /**
     * 사용자 역할 변경 (관리자용)
     */
    @Transactional
    public User updateUserRole(Long userId, String role) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        user.setRole(role);
        return userRepository.save(user);
    }

    /**
     * [시니어 개발자 조치] 사용자명을 기반으로 고유한 해시 세션 ID 생성
     */
    public Long generateSessionIdFromUsername(String username) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(username.getBytes(StandardCharsets.UTF_8));
            ByteBuffer buffer = ByteBuffer.wrap(hash);
            // SHA-256 해시의 처음 8바이트를 Long으로 변환하여 사용
            return buffer.getLong();
        } catch (NoSuchAlgorithmException e) {
            log.error("SHA-256 알고리즘을 찾을 수 없습니다. UUID 기반 임시 ID를 생성합니다.", e);
            return UUID.randomUUID().getMostSignificantBits() & Long.MAX_VALUE;
        }
    }
}