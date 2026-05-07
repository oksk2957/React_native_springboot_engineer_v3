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

    // Google ID Token 검증용 SigningKey 제공 (public)
    // 주의: Google ID Token은 ES256 알고리즘으로 서명되므로, 애플리케이션 자체의 SecretKey를 사용해서는 안 됩니다.
    // 이 메서드는 현재 잘못 구현되어 있으며, Google 공개키를 사용하도록 수정이 필요합니다.
    public SecretKey getSigningKeyForGoogle() {
        return getSigningKey();
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
                    .requireSignatureAlgorithm(SignatureAlgorithm.HS256) // HS256 알고리즘 명시적 요구
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
                    .requireSignatureAlgorithm(SignatureAlgorithm.HS256) // HS256 알고리즘 명시적 요구
                    .build()
                    .parseSignedClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }
}
