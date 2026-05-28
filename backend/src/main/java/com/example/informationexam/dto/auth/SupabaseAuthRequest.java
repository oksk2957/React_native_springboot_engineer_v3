package com.example.informationexam.dto.auth;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

// DEBUG: [Auth-2026-05-26] SupabaseAuthRequest DTO — 프론트엔드에서 전달받는 accessToken
// 원인: React Native/Expo에서 Supabase OAuth 로그인 후 accessToken을 백엔드로 전송
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SupabaseAuthRequest {

    // DEBUG: [Auth-DTO] Supabase access_token — 필수값, 빈 문자열 불가
    @NotBlank(message = "accessToken은 필수입니다.")
    private String accessToken;
}
