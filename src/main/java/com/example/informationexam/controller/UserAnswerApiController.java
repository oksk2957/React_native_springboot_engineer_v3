package com.example.informationexam.controller;

import com.example.informationexam.config.JwtTokenProvider;
import com.example.informationexam.domain.user.User;
import com.example.informationexam.dto.statistics.WrongAnswerListRow;
import com.example.informationexam.mapper.MypageStatisticsMapper;
import com.example.informationexam.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/wrong-answers")
@RequiredArgsConstructor
public class UserAnswerApiController {

    private final MypageStatisticsMapper mypageStatisticsMapper;
    private final UserService userService;
    private final JwtTokenProvider jwtTokenProvider;

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getWrongAnswers(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        User user = resolveUser(authHeader);
        return ResponseEntity.ok(toResponse(mypageStatisticsMapper.selectWrongAnswers(user.getId())));
    }

    @GetMapping("/{problemType}")
    public ResponseEntity<List<Map<String, Object>>> getWrongAnswersByType(
            @PathVariable String problemType,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        User user = resolveUser(authHeader);
        List<Map<String, Object>> filtered = toResponse(mypageStatisticsMapper.selectWrongAnswers(user.getId())).stream()
                .filter(row -> problemType.equals(row.get("problemType")))
                .toList();
        return ResponseEntity.ok(filtered);
    }

    /**
     * 특정 일자에 실제 발생한 오답 목록 조회 (달력 셀 → 오답 리스트 연동).
     */
    @GetMapping("/by-date")
    public ResponseEntity<List<Map<String, Object>>> getWrongAnswersByDate(
            @RequestParam String date,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        User user = resolveUser(authHeader);
        LocalDate day = LocalDate.parse(date);
        return ResponseEntity.ok(toResponse(mypageStatisticsMapper.selectWrongAnswersByDate(user.getId(), day)));
    }

    /**
     * 기존 프론트 호환 경로. 북마크 기준이 아니라 user_answer 오답 발생일 기준으로 반환한다.
     */
    @GetMapping("/bookmarks/by-date")
    public ResponseEntity<List<Map<String, Object>>> getWrongBookmarksByDate(
            @RequestParam String date,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        return getWrongAnswersByDate(date, authHeader);
    }

    private User resolveUser(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new IllegalArgumentException("Authorization 헤더가 필요합니다.");
        }
        String token = authHeader.substring(7).trim();
        String username = jwtTokenProvider.getUsername(token);
        return userService.getUserByUsername(username);
    }

    private List<Map<String, Object>> toResponse(List<WrongAnswerListRow> rows) {
        return rows.stream()
                .map(row -> Map.<String, Object>of(
                        "id", row.getId(),
                        "problemType", row.getProblemType(),
                        "referenceId", row.getReferenceId(),
                        "problemTitle", row.getQuestion() != null ? row.getQuestion() : "문제를 찾을 수 없습니다",
                        "submittedAnswer", row.getSubmittedAnswer() != null ? row.getSubmittedAnswer() : "",
                        "correctAnswer", row.getCorrectAnswer() != null ? row.getCorrectAnswer() : "정답을 찾을 수 없습니다",
                        "submittedAt", row.getSubmittedAt()
                ))
                .toList();
    }
}
