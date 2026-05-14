package com.example.informationexam.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.Collections;

@Service
@Slf4j
public class GoogleTokenVerifierService {

    @Value("${spring.security.oauth2.client.registration.google.client-id}")
    private String googleClientId;

    private final NetHttpTransport transport = new NetHttpTransport();
    private final GsonFactory jsonFactory = GsonFactory.getDefaultInstance();

    /**
     * Google ID Token 검증
     * @param idToken Google에서 받은 ID Token
     * @return 검증된 토큰의 payload
     * @throws IllegalArgumentException 토큰이 유효하지 않거나 설정이 누락된 경우
     */
    public GoogleIdToken.Payload verifyGoogleIdToken(String idToken) throws GeneralSecurityException, IOException {
        log.info("[TOKEN][VERIFY] token verification started");

        // 설정 검증: Google Client ID가 있는지 확인
        if (googleClientId == null || googleClientId.isEmpty()) {
            log.error("[TOKEN][CONFIG] Google Client ID is not configured. Set GOOGLE_CLIENT_ID environment variable.");
            throw new IllegalArgumentException("Google Client ID is not configured. Please set GOOGLE_CLIENT_ID environment variable.");
        }

        // 입력 검증
        if (idToken == null || idToken.isEmpty()) {
            log.warn("[TOKEN][VALIDATE] ID token is null or empty");
            throw new IllegalArgumentException("ID token is required");
        }

        GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(transport, jsonFactory)
                .setAudience(Collections.singletonList(googleClientId))
                .setIssuer("https://accounts.google.com")
                .build();

        log.debug("[TOKEN][VERIFY] verifier built with audience: {}, calling verifier.verify()", googleClientId);
        
        try {
            GoogleIdToken googleIdToken = verifier.verify(idToken);

            if (googleIdToken == null) {
                log.warn("[TOKEN][FAIL] Google ID token verification failed: token is invalid or expired");
                throw new IllegalArgumentException("Invalid or expired Google ID token");
            }

            GoogleIdToken.Payload payload = googleIdToken.getPayload();
            log.info("[TOKEN][SUCCESS] token verified, email: {}, name: {}, issuer: {}, audience: {}",
                    payload.getEmail(), payload.get("name"), payload.getIssuer(), payload.getAudience());

            return payload;
            
        } catch (GeneralSecurityException e) {
            log.error("[TOKEN][FAIL] Security exception during token verification: {}", e.getMessage());
            throw new IllegalArgumentException("Token verification failed: " + e.getMessage());
        } catch (IOException e) {
            log.error("[TOKEN][FAIL] IO exception during token verification: {}", e.getMessage());
            throw new IllegalArgumentException("Token verification failed: " + e.getMessage());
        }
    }
}