package com.example.informationexam.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.annotation.web.configurers.HeadersConfigurer;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

// DEBUG: [CORS-Fix-2026-05-26] Spring Security 6.x CORS 설정
// 원인: WebMvcConfigurer CORS 설정과 SecurityFilterChain CORS 설정이 충돌
// 해결: SecurityFilterChain에서만 CORS 설정 관리 (WebMvcConfigurer 설정 무시됨)
// 참고: allowedOriginPatterns 사용으로 withCredentials=true와 와일드카드 동시 지원
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    // DEBUG: [OCI-2026-05-28] 프론트엔드 Origin을 환경변수 또는 기본값으로 설정
    // 원인: 하드코딩된 IP로 인해 서버 IP 변경 시 재빌드 필요
    // 해결: 환경변수 FRONTEND_ORIGIN 사용, 미설정시 localhost:9000 fallback
    @Value("${frontend.origin:http://localhost:9000}")
    private String frontendOrigin;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(AbstractHttpConfigurer::disable)
                .addFilterBefore((request, response, chain) -> {
                    var req = (jakarta.servlet.http.HttpServletRequest) request;
                    System.out.println("[Backend Request] " + req.getMethod() + " " + req.getRequestURI() +
                                     " | Origin: " + req.getHeader("Origin") +
                                     " | Host: " + req.getHeader("Host"));
                    chain.doFilter(request, response);
                }, org.springframework.security.web.context.SecurityContextHolderFilter.class)
                .sessionManagement(session -> session.sessionCreationPolicy(org.springframework.security.config.http.SessionCreationPolicy.STATELESS))
                .headers(headers -> headers
                        .frameOptions(HeadersConfigurer.FrameOptionsConfig::disable))
                .authorizeHttpRequests(auth -> auth
                        // 인증 관련 엔드포인트는 모두 허용 (로그인/회원가입)
                        .requestMatchers("/api/auth/**").permitAll()
                        // OPTIONS 요청은 모두 허용 (CORS 프리플라이트)
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        // 나머지 요청도 모두 허용 (JWT 인증 없이)
                        .anyRequest().permitAll()
                )
                .formLogin(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // DEBUG: [C-2026-05-28] 와일드카드(*) 제거 - allowCredentials(true)와 충돌 방지
        // 원인: "*"와 allowCredentials(true) 동시 사용 시 CORS 오류 발생
        // 해결: 구체적인 Origin 패턴으로 대체
        List<String> allowedOriginPatterns = Arrays.asList(
            frontendOrigin,
            "http://158.180.78.125:9000",   // OCI Public IP (React frontend)
            "http://158.180.78.125:3000",   // OCI Public IP (React dev server)
            "http://158.180.78.125:19000",  // OCI Public IP (Expo)
            "http://158.180.78.125:19006",  // OCI Public IP (Expo web)
            "http://158.180.78.125:*",      // OCI Public IP 모든 포트
            "http://localhost:*",      // 모든 localhost 포트
            "http://127.0.0.1:*",      // 모든 127.0.0.1 포트
            "http://localhost:8081",   // React Native/Android 에뮬레이터
            "http://localhost:3000",   // React Dev Server
            "http://localhost:19000",  // Expo
            "http://localhost:19006",  // Expo
            "http://172.30.1.*:*",     // 개발 LAN
            "http://192.168.*:*",      // 일반 사설망
            "exp://*",               // Expo 개발 서버
            "https://gmhznnwecujoafdisscl.supabase.co", // Supabase 도메인
            "null"                   // DEBUG: [C-2026-05-28] React Native Origin이 null일 수 있음
        );

        // DEBUG: [C-2026-05-28] 환경변수로 Origin 동적 설정
        // 원인: 프로덕션 환경에서 특정 Origin만 허용해야 함
        // 해결: ALLOWED_ORIGINS 환경변수로 동적 설정
        // 사용법: export ALLOWED_ORIGINS="http://158.180.78.125:9000,http://localhost:3000"
        String envOrigins = System.getenv("ALLOWED_ORIGINS");
        if (envOrigins != null && !envOrigins.isEmpty()) {
            allowedOriginPatterns = Arrays.asList(envOrigins.split(","));
            // DEBUG: [C-2026-05-28] 환경변수로 설정된 Origin 로깅
            System.out.println("[CORS] 환경변수 ALLOWED_ORIGINS 적용: " + envOrigins);
        }

        configuration.setAllowedOriginPatterns(allowedOriginPatterns);

        // 허용 HTTP 메서드
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));

        // 허용 헤더
        configuration.setAllowedHeaders(Arrays.asList(
            "Authorization",
            "Content-Type",
            "X-Requested-With",
            "Accept",
            "Origin"
        ));

        // 노출 헤더
        configuration.setExposedHeaders(Arrays.asList(
            "Authorization",
            "Content-Type"
        ));

        // 자격 증명 허용 설정 (프론트엔드 withCredentials=true와 일치)
        configuration.setAllowCredentials(true);

        // 프리플라이트 캐시 시간 (1시간)
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);

        // DEBUG: [CORS-Fix] 최종 CORS 설정 로그 출력
        System.out.println("[CORS] Allowed Origin Patterns: " + allowedOriginPatterns);
        System.out.println("[CORS] Allow Credentials: " + configuration.getAllowCredentials());
        System.out.println("[CORS] Allowed Methods: " + configuration.getAllowedMethods());

        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
