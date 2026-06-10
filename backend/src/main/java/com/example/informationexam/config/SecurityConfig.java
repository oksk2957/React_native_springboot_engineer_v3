package com.example.informationexam.config;

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

        // DEBUG: [CORS-Fix-2026-06-10] CORS 설정 단순화 + credentials=false로 변경
        // 원인: 프론트엔드 api.ts에서 withCredentials 제거했지만 백엔드는 true로 설정 → 불일치
        //       과도한 Origin 패턴("null", "exp://*", "172.30.1.*:*" 등)으로 preflight 실패
        // 해결: allowCredentials(false) + 구체적인 Origin 목록만 허용
        // DEBUG: [수정40-2026-06-10] localhost:9000, 127.0.0.1:9000 추가
        // 원인: 프론트엔드가 포트 9000에서 실행되는데 CORS 목록에 localhost:9000이 없음
        //       → OPTIONS preflight 403 → 브라우저가 실제 요청 차단 → Network Error
        List<String> allowedOrigins = Arrays.asList(
            "http://localhost:8081",
            "http://localhost:3000",
            "http://localhost:9000",
            "http://localhost:19000",
            "http://localhost:19006",
            "http://127.0.0.1:8081",
            "http://127.0.0.1:3000",
            "http://127.0.0.1:9000",
            "http://158.180.78.125:9000",
            "http://158.180.78.125:3000",
            "https://gmhznnwecujoafdisscl.supabase.co"
        );

        configuration.setAllowedOrigins(allowedOrigins);
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH", "HEAD"));
        configuration.setAllowedHeaders(Arrays.asList(
            "Authorization", "Content-Type", "X-Requested-With", "Accept", "Origin"
        ));
        configuration.setExposedHeaders(Arrays.asList("Authorization", "Content-Type"));

        // DEBUG: [CORS-Fix-2026-06-10] credentials=false (프론트엔드 withCredentials 제거와 일치)
        configuration.setAllowCredentials(false);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);

        System.out.println("[CORS] Allowed Origins: " + allowedOrigins);
        System.out.println("[CORS] Allow Credentials: false");

        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
