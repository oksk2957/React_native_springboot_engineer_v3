package com.example.informationexam.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import jakarta.annotation.PostConstruct;
import java.util.Map;

// DEBUG: [Auth-Fix-2026-06-07] Supabase JWT 검증 서비스 - REST API 검증 방식으로 전환
// 원인: JWT Secret을 Management API로 가져올 수 없음 (해시값만 반환)
// 해결: Supabase Auth REST API(/auth/v1/user)를 통해 토큰을 직접 검증
//       JWT Secret 없이도 안전하게 토큰 유효성 확인 가능
@Service
@Slf4j
public class SupabaseTokenVerifierService {

    @Value("${supabase.url:https://gmhznnwecujoafdisscl.supabase.co}")
    private String supabaseUrl;

    @Value("${supabase.anon-key:}")
    private String anonKey;

    private WebClient webClient;

    @PostConstruct
    public void init() {
        if (anonKey == null || anonKey.isEmpty()) {
            // anon key가 없으면 기본 anon key 사용 (프론트엔드와 동일)
            anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdtaHpubndlY3Vqb2FmZGlzc2NsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2MjU4OTMsImV4cCI6MjA5MjIwMTg5M30.jaQObjuWjEoPI8ni-5MqHuBTuxQVCx3y1uPAb809eKc";
        }

        this.webClient = WebClient.builder()
                .baseUrl(supabaseUrl)
                .defaultHeader("apikey", anonKey)
                .build();

        log.info("[SupabaseTokenVerifier] REST API 검증 방식 초기화 완료 - URL: {}", supabaseUrl);
    }

    public String extractBearerToken(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new IllegalArgumentException("Authorization 헤더가 올바르지 않습니다.");
        }
        return authHeader.substring(7).trim();
    }

    /**
     * DEBUG: [Auth-Fix-2026-06-07] Supabase Auth REST API를 통한 토큰 검증
     * 원인: JWT Secret 기반 검증이 Management API 제한으로 불가
     * 해결: /auth/v1/user 엔드포인트에 토큰을 보내서 유효성 확인
     *       토큰이 유효하면 Supabase가 사용자 정보를 반환, 아니면 401 에러
     */
    public String getEmail(String token) {
        try {
            // 1. Supabase Auth API로 토큰 검증 및 사용자 정보 조회
            log.debug("[SupabaseTokenVerifier] REST API로 토큰 검증 시작");

            @SuppressWarnings("unchecked")
            Map<String, Object> response = webClient.get()
                    .uri("/auth/v1/user")
                    .header("Authorization", "Bearer " + token)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            if (response == null) {
                throw new IllegalArgumentException("Supabase Auth API 응답이 없습니다.");
            }

            // 2. 응답에서 이메일 추출
            String email = (String) response.get("email");
            if (email == null || email.isBlank()) {
                throw new IllegalArgumentException("토큰에서 이메일을 찾을 수 없습니다.");
            }

            log.debug("[SupabaseTokenVerifier] REST API 검증 성공 - email: {}", email);
            return email;

        } catch (WebClientResponseException e) {
            log.error("[SupabaseTokenVerifier] Supabase 토큰 검증 실패 (HTTP {}): {}",
                    e.getStatusCode(), e.getResponseBodyAsString());
            throw new IllegalArgumentException("유효하지 않은 Supabase 토큰입니다.", e);
        } catch (Exception e) {
            log.error("[SupabaseTokenVerifier] Supabase 토큰 검증 실패: {}", e.getMessage());
            throw new IllegalArgumentException("Supabase 토큰 검증 중 오류 발생", e);
        }
    }

    /**
     * DEBUG: [Auth-Fix-2026-06-07] JWT에서 subject 추출 (REST API 검증 후 사용)
     * UserService에서 googleId로 사용하기 위해 추가
     */
    public String getSubject(String token) {
        try {
            // JWT payload 파싱 (서명 검증 없이 디코딩만)
            String[] parts = token.split("\\.");
            if (parts.length >= 2) {
                String payload = new String(java.util.Base64.getUrlDecoder().decode(parts[1]));
                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                @SuppressWarnings("unchecked")
                Map<String, Object> claims = mapper.readValue(payload, Map.class);
                String subject = (String) claims.get("sub");
                if (subject != null && !subject.isBlank()) {
                    return subject;
                }
            }
        } catch (Exception e) {
            log.warn("[SupabaseTokenVerifier] JWT subject 추출 실패: {}", e.getMessage());
        }
        return null;
    }
}
