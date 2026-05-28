package com.example.informationexam.dto.auth;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

// DEBUG: [Auth-2026-05-26] AuthResponse DTO — 로그인 성공 시 반환하는 JWT 및 사용자 정보
// 원인: 프론트엔드에서 로그인 후 JWT 토큰과 사용자 정보를 받아야 함
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {

    // DEBUG: [Auth-DTO] 자체 발급 JWT 토큰 — 프론트엔드에서 Authorization 헤더에 사용
    private String token;

    // DEBUG: [Auth-DTO] 사용자 정보 — 프론트엔드에서 사용자 상태 관리용
    private UserInfo user;

    // DEBUG: [Auth-DTO] 내부 클래스 — 사용자 기본 정보
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserInfo {
        private Long id;
        private String email;
        private String name;
        private String role;
    }
}
