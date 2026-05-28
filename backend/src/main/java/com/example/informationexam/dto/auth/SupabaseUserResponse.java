package com.example.informationexam.dto.auth;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

// DEBUG: [Auth-2026-05-26] SupabaseUserResponse DTO — Supabase auth/v1/user API 응답 매핑
// 원인: Supabase auth/v1/user API 호출 후 응답 JSON을 매핑하기 위한 DTO
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SupabaseUserResponse {

    // DEBUG: [Auth-DTO] Supabase 사용자 ID — auth.users.id
    private String id;

    // DEBUG: [Auth-DTO] 사용자 이메일
    private String email;

    // DEBUG: [Auth-DTO] 사용자 표시 이름 (선택적)
    private String displayName;

    // DEBUG: [Auth-DTO] 추가 사용자 메타데이터
    private Map<String, Object> userMetadata;
}
