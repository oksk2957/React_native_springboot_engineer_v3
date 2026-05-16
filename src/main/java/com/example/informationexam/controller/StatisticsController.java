package com.example.informationexam.controller;

import com.example.informationexam.config.JwtTokenProvider;
import com.example.informationexam.domain.user.User;
import com.example.informationexam.service.StatisticsService;
import com.example.informationexam.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/statistics")
@RequiredArgsConstructor
public class StatisticsController {

    private final StatisticsService statisticsService;
    private final UserService userService;
    private final JwtTokenProvider jwtTokenProvider;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getStatistics(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestParam(value = "userId", required = false) Long userIdParam) {

        if (authHeader == null || authHeader.isBlank()) {
            return ResponseEntity.status(401).body(Map.of(
                    "error", true,
                    "message", "Authorization 헤더가 필요합니다."
            ));
        }

        if (!authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).body(Map.of(
                    "error", true,
                    "message", "Bearer 형식의 토큰이 필요합니다."
            ));
        }

        try {
            String token = authHeader.substring(7).trim();
            String username = jwtTokenProvider.getUsername(token);
            User user = userService.getUserByUsername(username);

            if (userIdParam != null && !userIdParam.equals(user.getId())) {
                return ResponseEntity.status(403).body(Map.of(
                        "error", true,
                        "message", "userId가 인증된 사용자와 일치하지 않습니다."
                ));
            }

            return ResponseEntity.ok(statisticsService.getOverallStatistics(user.getId()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(401).body(Map.of(
                    "error", true,
                    "message", "유효하지 않은 토큰입니다: " + e.getMessage(),
                    "exceptionType", e.getClass().getName()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                    "error", true,
                    "message", "서버 오류: " + e.getMessage(),
                    "exceptionType", e.getClass().getName()
            ));
        }
    }

    @GetMapping("/subjective-count")
    public ResponseEntity<Map<String, Long>> getSubjectiveCount(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        Map<String, Long> response = new HashMap<>();
        Long userId = null;

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            try {
                String token = authHeader.substring(7).trim();
                String username = jwtTokenProvider.getUsername(token);
                User user = userService.getUserByUsername(username);
                userId = user.getId();
            } catch (Exception e) {
                // 토큰이 유효하지 않아도 전체 개수는 반환하도록 예외 처리
            }
        }

        response.put("count", statisticsService.getSubjectiveRemainingCount(userId));
        return ResponseEntity.ok(response);
    }
}
