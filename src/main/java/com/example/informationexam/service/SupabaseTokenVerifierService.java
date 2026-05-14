package com.example.informationexam.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;

@Service
@Slf4j
public class SupabaseTokenVerifierService {

    @Value("${supabase.url:https://gmhznnwecujoafdisscl.supabase.co}")
    private String supabaseUrl;

    private JwtDecoder jwtDecoder;

    @PostConstruct
    public void init() {
        String jwkSetUri = supabaseUrl.replaceAll("/$", "") + "/auth/v1/.well-known/jwks.json";
        log.info("JWKS 기반 Supabase 토큰 검증기 초기화 중: {}", jwkSetUri);
        // Supabase의 JWKS 엔드포인트 URL을 통해 공개키를 자동으로 내려받아 서명을 검증하는 디코더 생성
        this.jwtDecoder = NimbusJwtDecoder.withJwkSetUri(jwkSetUri).build();
        log.info("JWKS 기반 Supabase 토큰 검증기 초기화 완료");
    }

    public String extractBearerToken(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new IllegalArgumentException("Authorization 헤더가 올바르지 않습니다.");
        }
        return authHeader.substring(7).trim();
    }

    public String getEmail(String token) {
        try {
            // 1. 토큰 서명 검증 및 파싱 (JWKS 자동 검증 및 만료 시간 확인 포함)
            Jwt jwt = jwtDecoder.decode(token);
            
            // 2. 이메일 추출
            String email = extractEmailOrSubject(jwt);
            log.debug("이메일 확인: {}", email);
            System.out.println("사용자 이메일 확인중입니다: " + email);
            return email;
        } catch (Exception e) {
            log.error("Supabase 토큰 검증 실패: {}", e.getMessage());
            throw new IllegalArgumentException("유효하지 않은 Supabase 토큰입니다.", e);
        }
    }

    private String extractEmailOrSubject(Jwt jwt) {
        String email = jwt.getClaimAsString("email");
        if (email != null && !email.isBlank()) {
            return email;
        }
        
        String subject = jwt.getSubject();
        if (subject != null && !subject.isBlank()) {
            return subject;
        }
        
        throw new IllegalArgumentException("토큰에서 이메일 또는 subject를 찾을 수 없습니다.");
    }
}
