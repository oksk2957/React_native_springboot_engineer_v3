package com.example.informationexam.controller;

import com.example.informationexam.service.StatisticsService;
import com.example.informationexam.domain.user.User;
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
    private final com.example.informationexam.config.JwtTokenProvider jwtTokenProvider;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getStatistics(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        Long userId = null;

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            try {
                String token = authHeader.replace("Bearer ", "");
                String username = jwtTokenProvider.getUsername(token);
                User user = userService.getUserByUsername(username);
                userId = user.getId();
            } catch (Exception e) {
                // 토큰이 유효하지 않아도 전체 통계는 반환하도록 예외 처리
            }
        }

        return ResponseEntity.ok(statisticsService.getOverallStatistics(userId));
    }

    @GetMapping("/subjective-count")
    public ResponseEntity<Map<String, Long>> getSubjectiveCount(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        Map<String, Long> response = new HashMap<>();
        Long userId = null;
        
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            try {
                String token = authHeader.replace("Bearer ", "");
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

    // DEBUG: [2026-06-07] 과목별 시도 횟수 랭킹 조회
    @GetMapping("/subject-ranking")
    public ResponseEntity<?> getSubjectRanking(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        Long userId = null;

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            try {
                String token = authHeader.replace("Bearer ", "");
                String username = jwtTokenProvider.getUsername(token);
                User user = userService.getUserByUsername(username);
                userId = user.getId();
            } catch (Exception e) {
                // 토큰이 유효하지 않아도 빈 결과 반환
                return ResponseEntity.ok(new java.util.ArrayList<>());
            }
        }

        // userId가 없으면 빈 결과 반환 (로그인 필요 없음)
        if (userId == null) {
            return ResponseEntity.ok(new java.util.ArrayList<>());
        }

        return ResponseEntity.ok(statisticsService.getSubjectRanking(userId));
    }

    // DEBUG: [2026-06-09-수정계획안09] 개인 오답 통계 - 문제별 오답 횟수 (userId 필터링, 페이지네이션)
    @GetMapping("/wrong-answer-ranking")
    public ResponseEntity<?> getWrongAnswerRanking(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestParam(defaultValue = "0") int offset,
            @RequestParam(defaultValue = "30") int limit) {
        Long userId = null;

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            try {
                String token = authHeader.replace("Bearer ", "");
                String username = jwtTokenProvider.getUsername(token);
                User user = userService.getUserByUsername(username);
                userId = user.getId();
            } catch (Exception e) {
                // 토큰이 유효하지 않으면 빈 결과 반환
                return ResponseEntity.ok(new java.util.ArrayList<>());
            }
        }

        if (userId == null) {
            return ResponseEntity.ok(new java.util.ArrayList<>());
        }

        return ResponseEntity.ok(statisticsService.getWrongAnswerRanking(userId, offset, limit));
    }
}
