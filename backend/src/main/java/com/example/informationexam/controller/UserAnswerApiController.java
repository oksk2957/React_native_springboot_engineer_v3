package com.example.informationexam.controller;

import com.example.informationexam.domain.problem.Problem;
import com.example.informationexam.domain.problem.ProblemRepository;
import com.example.informationexam.domain.user.User;
import com.example.informationexam.domain.useranswer.UserAnswer;
import com.example.informationexam.service.UserService;
import com.example.informationexam.domain.useranswer.UserAnswerRepository;
import com.example.informationexam.config.JwtTokenProvider;
import com.example.informationexam.mapper.MypageStatisticsMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/wrong-answers")
@RequiredArgsConstructor
public class UserAnswerApiController {

    private final UserAnswerRepository userAnswerRepository;
    private final ProblemRepository problemRepository;
    private final UserService userService;
    private final JwtTokenProvider jwtTokenProvider;
    private final MypageStatisticsMapper mypageStatisticsMapper;

    // DEBUG: [2026-06-07] Optional Auth 패턴 적용 (StatisticsController 동기화)
    // 원인: 토큰 없으면 즉시 401 반환 → 프론트엔드에서 401 에러 다발생
    // 해결: 토큰 있으면 userId 추출, 없으면 빈 리스트 반환 (StatisticsController와 동일 패턴)
    // 보안: 토큰이 유효하면 본인 것만 반환, userId 쿼리파라미터로 다른 사용자 요청 시 403
    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getWrongAnswers(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        return ResponseEntity.ok(buildWrongAnswerResponse(authHeader));
    }

    // DEBUG: [2026-06-07] 프론트엔드가 /wrong-answers/OBJECTIVE 형태로 호출하므로
    // 원인: 기존 /type/{type} 매핑과 프론트 요청 경로 불일치 → 500 발생
    // 해결: /{type} 경로 추가 (하위 호환을 위해 /type/{type}도 유지)
    @GetMapping("/{type}")
    public ResponseEntity<List<Map<String, Object>>> getWrongAnswersByType(
            @PathVariable String type,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        List<Map<String, Object>> allWrongAnswers = buildWrongAnswerResponse(authHeader);
        List<Map<String, Object>> filtered = allWrongAnswers.stream()
                .filter(m -> type.equals(m.get("problemType")))
                .collect(Collectors.toList());
        return ResponseEntity.ok(filtered);
    }

    // DEBUG: [2026-06-07] 날짜별 오답 조회 엔드포인트 신규 추가
    // MypageStatisticsMapper.selectWrongAnswersByDate 활용
    @GetMapping("/by-date")
    public ResponseEntity<List<Map<String, Object>>> getWrongAnswersByDate(
            @RequestParam("date") String date,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        Long userId = extractUserId(authHeader);
        if (userId == null) {
            // DEBUG: 토큰 없으면 빈 리스트 반환
            return ResponseEntity.ok(Collections.emptyList());
        }

        List<Map<String, Object>> response = mypageStatisticsMapper.selectWrongAnswersByDate(userId, LocalDate.parse(date))
                .stream()
                .map(row -> {
                    Map<String, Object> map = new java.util.LinkedHashMap<>();
                    map.put("id", row.getId());
                    map.put("problemType", row.getProblemType());
                    map.put("referenceId", row.getReferenceId());
                    map.put("problemTitle", row.getQuestion() != null ? row.getQuestion() : "문제를 찾을 수 없습니다");
                    map.put("submittedAnswer", row.getSubmittedAnswer());
                    map.put("correctAnswer", row.getCorrectAnswer());
                    map.put("submittedAt", row.getSubmittedAt() != null ? row.getSubmittedAt().toString() : "");
                    return map;
                })
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    // DEBUG: [2026-06-08] IDOR 취약점 수정 - 토큰 기반 userId 추출만 허용
    // 원인: 기존 extractUserId는 토큰 실패 시 userIdParam fallback → IDOR 취약점
    // 해결: 토큰 없거나 실패하면 null 반환, userIdParam 파라미터 제거
    // 보안: OWASP A01:2021 Broken Access Control 방지
    private Long extractUserId(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            // DEBUG: 토큰 없으면 null
            return null;
        }
        try {
            String token = authHeader.replace("Bearer ", "");
            String username = jwtTokenProvider.getUsername(token);
            User user = userService.getUserByUsername(username);
            return user.getId();
        } catch (Exception e) {
            // DEBUG: 토큰 검증 실패 시 null 반환 (fallback 제거)
            log.warn("[AUTH] 토큰 검증 실패: {}", e.getMessage());
            return null;
        }
    }

    // DEBUG: [2026-06-08] IDOR 취약점 수정 - userIdParam 제거
    // 원인: 기존 buildWrongAnswerResponse는 userIdParam fallback 사용 → 보안 취약
    // 해결: extractUserId(authHeader)만 사용하여 토큰 기반 인증만 허용
    // DEBUG: [2026-06-07] MypageStatisticsMapper.selectWrongAnswers 쿼리 사용 (UNION ALL로 모든 타입 처리)
    // 원인: 기존 코드가 problemRepository만 조회 → SUBJECTIVE/PROGRAMMING_LANGUAGE 타입은 "문제를 찾을 수 없습니다"
    // 해결: selectWrongAnswers 쿼리가 UNION ALL로 problem, subjective_problems, programming_language_problems 모두 처리
    private List<Map<String, Object>> buildWrongAnswerResponse(String authHeader) {
        Long userId = extractUserId(authHeader);
        if (userId == null) {
            // DEBUG: 토큰 없으면 빈 리스트 반환
            return Collections.emptyList();
        }

        // DEBUG: [2026-06-07] MypageStatisticsMapper.selectWrongAnswers 사용 (모든 문제 타입 처리)
        return mypageStatisticsMapper.selectWrongAnswers(userId)
                .stream()
                .map(row -> {
                    Map<String, Object> map = new java.util.LinkedHashMap<>();
                    map.put("id", row.getId());
                    map.put("problemType", row.getProblemType());
                    map.put("referenceId", row.getReferenceId());
                    map.put("problemTitle", row.getQuestion() != null ? row.getQuestion() : "문제를 찾을 수 없습니다");
                    map.put("submittedAnswer", row.getSubmittedAnswer());
                    map.put("correctAnswer", row.getCorrectAnswer());
                    map.put("submittedAt", row.getSubmittedAt() != null ? row.getSubmittedAt().toString() : "");
                    return map;
                })
                .collect(Collectors.toList());
    }
}
