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

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {
    private final UserRepository userRepository;
    private final JwtTokenProvider jwtTokenProvider;

    /**
     * Google 로그인 처리
     * - 이미 등록된 사용자인 경우: 기존 사용자 정보 반환
     * - 신규 사용자인 경우: 자동으로 회원가입 후 반환
     */
    @Transactional
    public Map<String, Object> loginWithGoogle(String googleId, String email, String name) {
        // 1. googleId로 기존 사용자 조회
        Optional<User> existingUser = userRepository.findByGoogleId(googleId);

        User user;
        boolean isNewUser = false;

        if (existingUser.isPresent()) {
            // 기존 사용자 - 로그인 처리
            user = existingUser.get();
            log.info("Existing user login - id: {}, email: {}, username: {}", 
                    user.getId(), user.getEmail(), user.getUsername());
        } else {
            // 신규 사용자 - 자동 회원가입
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
}