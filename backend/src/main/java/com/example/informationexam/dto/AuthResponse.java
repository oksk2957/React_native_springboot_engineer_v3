package com.example.informationexam.dto;

import lombok.Builder;
import lombok.Value;

/**
 * 인증 응답 DTO
 * Google OAuth 로그인 후 서버 자체 JWT와 사용자 정보를 함께 반환합니다.
 */
@Value
@Builder
public class AuthResponse {
    String token;        // 서버 자체 JWT 토큰
    String username;     // 사용자명
    String nickname;     // 닉네임
    String email;        // 이메일
    String role;         // 역할 (TRIAL_USER, USER, ADMIN 등)
}
