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

    public GoogleIdToken.Payload verifyGoogleIdToken(String idToken) throws GeneralSecurityException, IOException {
        log.info("[TOKEN][VERIFY] token verification started");

        GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(transport, jsonFactory)
                .setAudience(Collections.singletonList(googleClientId))
                .setIssuer("https://accounts.google.com")
                .build();

        log.debug("[TOKEN][VERIFY] verifier built, calling verifier.verify()");
        GoogleIdToken googleIdToken = verifier.verify(idToken);

        if (googleIdToken == null) {
            log.warn("[TOKEN][FAIL] Google ID token verification failed: token is invalid or expired");
            throw new IllegalArgumentException("Invalid or expired Google ID token");
        }

        GoogleIdToken.Payload payload = googleIdToken.getPayload();
        log.info("[TOKEN][SUCCESS] token verified, email: {}, name: {}",
                payload.getEmail(), payload.get("name"));

        return payload;
    }
}