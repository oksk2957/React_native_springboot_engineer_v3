package com.example.informationexam.controller;

import com.example.informationexam.config.JwtTokenProvider;
import com.example.informationexam.controller.dto.AnswerRequest;
import com.example.informationexam.service.AnswerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/answers")
@RequiredArgsConstructor
public class AnswerApiController {

    private final AnswerService answerService;
    private final JwtTokenProvider jwtTokenProvider;

    @PostMapping("/submit")
    public ResponseEntity<Map<String, Object>> submitAnswer(
            @RequestBody AnswerRequest request,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        // DEBUG: [2026-06-08] JWT 토큰 진단 로그
        boolean hasAuthHeader = (authHeader != null && authHeader.startsWith("Bearer "));
        System.out.println("[AnswerApiController] Authorization 헤더 유무: " + hasAuthHeader);

        String username = resolveUsername(authHeader);
        System.out.println("[AnswerApiController] 추출된 username: " + username);

        return ResponseEntity.ok(answerService.submitAnswer(request, username));
    }

    private String resolveUsername(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return null;
        }
        String token = authHeader.substring(7).trim();
        try {
            return jwtTokenProvider.getUsername(token);
        } catch (Exception e) {
            return null;
        }
    }
}
