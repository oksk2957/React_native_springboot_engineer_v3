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
        String username = resolveUsername(authHeader);
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
