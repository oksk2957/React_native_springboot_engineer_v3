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
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    // 프론트엔드 Origin을 환경변수 또는 기본값으로 설정
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
                        // 나머지 요청도 일단 모두 허용 (추후 JWT 인증 추가)
                        .anyRequest().permitAll()
                )
                .formLogin(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // 개발 환경:_allowedOrigin 목록 (개발 편의를 위해 추가)
        List<String> allowedOrigins = Arrays.asList(
            frontendOrigin,
            "http://localhost:8081",   // React Native/Android 에뮬레이터
            "http://localhost:3000",   // React Dev Server
            "http://localhost:19000",  // Expo
            "http://localhost:19006"   // Expo
        );

        // PRODUCTION 환경에서는 환경변수에서 오리진 설정을 덮어쓰거나 "*" 모든 origins 허용 등 환경별 설정
        String envOrigins = System.getenv("ALLOWED_ORIGINS");
        if (envOrigins != null && !envOrigins.isEmpty()) {
            allowedOrigins = Arrays.asList(envOrigins.split(","));
        }

        configuration.setAllowedOrigins(allowedOrigins);

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

        // 자격 증명 허용 설정
        configuration.setAllowCredentials(true);

        // 프리플라이트 캐시 시간 (1시간)
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);

        System.out.println("[CORS] Allowed Origins: " + allowedOrigins);

        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
