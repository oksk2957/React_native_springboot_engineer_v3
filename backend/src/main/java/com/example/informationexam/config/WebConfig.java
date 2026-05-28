package com.example.informationexam.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

// DEBUG: [CORS-Fix-2026-05-26] WebConfig CORS 설정 비활성화
// 원인: Spring Security 6.x에서는 SecurityFilterChain의 CORS 설정이 우선 적용됨
//       WebMvcConfigurer의 CORS 설정과 SecurityFilterChain의 CORS 설정이 충돌할 수 있음
// 해결: SecurityConfig에서만 CORS 설정 관리 (단일 소스 원칙)
// 참고: WebMvcConfigurer CORS 설정은 Spring Security가 적용되지 않는 엔드포인트에서만 유효
@Configuration
public class WebConfig implements WebMvcConfigurer {
    // Spring Security 6.x에서 CORS는 SecurityFilterChain에서 처리하므로
    // WebMvcConfigurer의 addCorsMappings는 사용하지 않음
    // SecurityConfig.corsConfigurationSource()가 모든 CORS 설정을 담당
}
