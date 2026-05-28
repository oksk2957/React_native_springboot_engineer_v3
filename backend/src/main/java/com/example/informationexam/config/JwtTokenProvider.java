package com.example.informationexam.config;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
public class JwtTokenProvider {

    @Value("${jwt.secret}")
    private String secretKey;

    @Value("${jwt.token-validity-in-seconds}")
    private long tokenValidityInSeconds;

    private SecretKey getSigningKey() {
        byte[] keyBytes = secretKey.getBytes(StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    public String createToken(String username) {
        Date now = new Date();
        Date validity = new Date(now.getTime() + tokenValidityInSeconds * 1000);

        return Jwts.builder()
                .subject(username)
                .issuedAt(now)
                .expiration(validity)
                .signWith(getSigningKey())
                .compact();
    }

    public String getUsername(String token) {
        try {
            return Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(token)
                    .getPayload()
                    .getSubject();
        } catch (JwtException | IllegalArgumentException e) {
            throw e;
        }
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    // DEBUG: [JWT-2026-05-28] 토큰 만료 시간 확인 메서드 추가
    // 원인: 12시간 유효기간 만료 전 자동 갱신을 위해 만료 시간 확인 필요
    // 해결: 토큰에서 만료 시간(Expiration)을 추출하여 반환
    public Date getExpirationDate(String token) {
        try {
            return Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(token)
                    .getPayload()
                    .getExpiration();
        } catch (JwtException | IllegalArgumentException e) {
            return null;
        }
    }

    // DEBUG: [JWT-2026-05-28] 토큰 갱신 메서드 추가
    // 원인: 12시간 유효기간 만료 전 자동 갱신을 위해 토큰 재발급 필요
    // 해결: 기존 토큰에서 사용자명을 추출하여 새로운 토큰 발급
    public String refreshToken(String token) {
        String username = getUsername(token);
        if (username == null) {
            throw new JwtException("토큰에서 사용자명을 추출할 수 없습니다.");
        }
        return createToken(username);
    }
}
