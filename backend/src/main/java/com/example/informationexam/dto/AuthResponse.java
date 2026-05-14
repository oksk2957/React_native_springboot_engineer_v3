package com.example.informationexam.dto;

import lombok.Builder;
import lombok.Value;

/**
 * 인증 응답 DTO
 * Google OAuth 로그인 시 백엔드 JWT와 사용자 정보를 함께 반환합니다.
 */
@Value
@Builder
public class AuthResponse {
    String token;        // 백엔드 JWT 토큰
    String username;     // 사용자명
    String nickname;     // 닉네임
    String email;        // 이메일
    String role;         // 역할 (free_user, money_user, admin)
    String profileImage;  // 프로필 이미지 URL
    boolean isAdmin;     // 관리자 여부
    boolean trialExpired; // 체험 기간 만료 여부
    boolean requiresPayment; // 결제 필요 여부
    boolean canAccessApp; // 앱 접근 가능 여부
    String paymentMessage; // 결제 안내 메시지
    boolean isNewUser;    // 신규 사용자 여부
    boolean requiresNickname; // 닉네임 설정 필요 여부
    Long userId;          // 사용자 ID
}
