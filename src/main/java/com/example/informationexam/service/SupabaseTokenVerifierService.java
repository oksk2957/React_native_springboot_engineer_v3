package com.example.informationexam.service;

import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.text.ParseException;
import java.util.Base64;
import java.util.Date;
import java.util.List;

@Service
@Slf4j
public class SupabaseTokenVerifierService {

    @Value("${supabase.jwt-secret:}")
    private String supabaseJwtSecret;

    @Value("${supabase.jwt-issuer:}")
    private String supabaseJwtIssuer;

    @Value("${supabase.jwt-audience:authenticated}")
    private String supabaseJwtAudience;

    public String extractBearerToken(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new IllegalArgumentException("Authorization 헤더가 올바르지 않습니다.");
        }
        return authHeader.substring(7).trim();
    }

    public String getEmail(String token) {
        JWTClaimsSet claims = verifyAndGetClaims(token);
        String email = claims.getStringClaim("email");
        log.debug("이메일확인: {}", email);
        System.out.println("임시방편으로 확인합니다");
        System.out.println(email);

        
        if (email == null || email.isBlank()) {
            email = claims.getSubject();
        }
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("토큰에서 이메일을 찾을 수 없습니다.");
        }
        return email;
    }

    private JWTClaimsSet verifyAndGetClaims(String token) {
        try {
            SignedJWT signedJWT = SignedJWT.parse(token);

            if (signedJWT.getHeader().getAlgorithm() == null || JWSAlgorithm.NONE.equals(signedJWT.getHeader().getAlgorithm())) {
                throw new IllegalArgumentException("지원하지 않는 토큰 형식입니다.");
            }

            if (supabaseJwtSecret == null || supabaseJwtSecret.isBlank()) {
                throw new IllegalStateException("Supabase JWT secret이 설정되지 않았습니다.");
            }

            byte[] secretBytes = decodeSecret(supabaseJwtSecret);
            try {
                if (!signedJWT.verify(new MACVerifier(secretBytes))) {
                    throw new IllegalArgumentException("유효하지 않은 Supabase 토큰입니다.");
                }
            } catch (JOSEException e) {
                log.error("Supabase 토큰 서명 검증 실패", e);
                throw new IllegalArgumentException("Supabase 토큰 서명 검증 중 오류가 발생했습니다.", e);
            }

            JWTClaimsSet claims = signedJWT.getJWTClaimsSet();
            validateClaims(claims);
            return claims;
        } catch (ParseException e) {
            log.error("Supabase 토큰 파싱 실패", e);
            throw new IllegalArgumentException("Supabase 토큰 파싱에 실패했습니다.", e);
        } catch (IllegalArgumentException | IllegalStateException e) {
            log.warn("Supabase 토큰 검증 실패: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Supabase 토큰 검증 중 알 수 없는 오류", e);
            throw new IllegalArgumentException("Supabase 토큰 검증 중 오류가 발생했습니다.", e);
        }
    }

    private void validateClaims(JWTClaimsSet claims) {
        Date expiration = claims.getExpirationTime();
        if (expiration != null && expiration.before(new Date())) {
            throw new IllegalArgumentException("만료된 Supabase 토큰입니다.");
        }

        if (supabaseJwtIssuer != null && !supabaseJwtIssuer.isBlank()) {
            String issuer = claims.getIssuer();
            if (!supabaseJwtIssuer.equals(issuer)) {
                throw new IllegalArgumentException("토큰 issuer가 일치하지 않습니다.");
            }
        }

        if (supabaseJwtAudience != null && !supabaseJwtAudience.isBlank()) {
            List<String> audience = claims.getAudience();
            if (audience == null || !audience.contains(supabaseJwtAudience)) {
                throw new IllegalArgumentException("토큰 audience가 일치하지 않습니다.");
            }
        }

        String email = claims.getStringClaim("email");
        if (email == null || email.isBlank()) {
            log.debug("이메일확인: {}", email);
            System.out.println("임시방편으로 확인합니다");
            System.out.println(claims);

            String subject = claims.getSubject();

            if (subject == null || subject.isBlank()) {
                throw new IllegalArgumentException("토큰에서 이메일 또는 subject를 찾을 수 없습니다.");
            }
        }
    }

    private byte[] decodeSecret(String secret) {
        try {
            return Base64.getDecoder().decode(secret);
        } catch (IllegalArgumentException ex) {
            return secret.getBytes(java.nio.charset.StandardCharsets.UTF_8);
        }
    }
}
