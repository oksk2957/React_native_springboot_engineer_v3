package com.example.informationexam.controller;

import com.example.informationexam.domain.user.User;
import com.example.informationexam.service.StatisticsService;
import com.example.informationexam.service.SupabaseTokenVerifierService;
import com.example.informationexam.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/statistics")
@RequiredArgsConstructor
public class StatisticsController {

    private final StatisticsService statisticsService;
    private final UserService userService;
    private final SupabaseTokenVerifierService supabaseTokenVerifierService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getStatistics(@RequestHeader("Authorization") String authHeader) {
        String token = supabaseTokenVerifierService.extractBearerToken(authHeader);
        String email = supabaseTokenVerifierService.getEmail(token);
        User user = userService.getUserByEmail(email);

        return ResponseEntity.ok(statisticsService.getOverallStatistics(user.getId()));
    }

    @GetMapping("/subjective-count")
    public ResponseEntity<Map<String, Long>> getSubjectiveCount(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        Map<String, Long> response = new HashMap<>();
        Long userId = null;

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            try {
                String token = supabaseTokenVerifierService.extractBearerToken(authHeader);
                String email = supabaseTokenVerifierService.getEmail(token);
                User user = userService.getUserByEmail(email);
                userId = user.getId();
            } catch (Exception e) {
                // 토큰이 유효하지 않아도 전체 개수는 반환하도록 예외 처리
            }
        }

        response.put("count", statisticsService.getSubjectiveRemainingCount(userId));
        return ResponseEntity.ok(response);
    }
}
