package com.example.informationexam.controller;

import com.example.informationexam.domain.problem.Problem;
import com.example.informationexam.domain.problem.ProblemRepository;
import com.example.informationexam.domain.problem.ProgrammingLanguageProblem;
import com.example.informationexam.domain.problem.ProgrammingLanguageProblemRepository;
import com.example.informationexam.domain.problem.SubjectiveProblem;
import com.example.informationexam.domain.problem.SubjectiveProblemRepository;
import com.example.informationexam.domain.user.User;
import com.example.informationexam.domain.useranswer.UserAnswer;
import com.example.informationexam.service.UserService;
import com.example.informationexam.domain.useranswer.UserAnswerRepository;
import com.example.informationexam.config.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/wrong-answers")
@RequiredArgsConstructor
public class UserAnswerApiController {

    private final UserAnswerRepository userAnswerRepository;
    private final ProblemRepository problemRepository;
    private final SubjectiveProblemRepository subjectiveProblemRepository;
    private final ProgrammingLanguageProblemRepository programmingLanguageProblemRepository;
    private final UserService userService;
    private final JwtTokenProvider jwtTokenProvider;

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getWrongAnswers(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).build();
        }

        String token = authHeader.replace("Bearer ", "");
        String username = jwtTokenProvider.getUsername(token);
        User user = userService.getUserByUsername(username);

        List<UserAnswer> wrongAnswers = userAnswerRepository.findByUserIdAndIsCorrect(user.getId(), false);

        List<Map<String, Object>> response = wrongAnswers.stream().map(ua -> {
            Map<String, Object> map = Map.of(
                "id", ua.getId(),
                "problemType", ua.getProblemType(),
                "referenceId", ua.getReferenceId(),
                "problemTitle", ua.getProblemQuestion() != null ? ua.getProblemQuestion() : "문제를 찾을 수 없습니다",
                "submittedAnswer", ua.getSubmittedAnswer(),
                "correctAnswer", ua.getCorrectAnswer() != null ? ua.getCorrectAnswer() : "정답을 찾을 수 없습니다",
                "submittedAt", ua.getSubmittedAt()
            );
            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    /**
     * 특정 문제 유형의 오답만 조회
     */
    @GetMapping("/{problemType}")
    public ResponseEntity<List<Map<String, Object>>> getWrongAnswersByType(
            @PathVariable String problemType,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).build();
        }

        String token = authHeader.replace("Bearer ", "");
        String username = jwtTokenProvider.getUsername(token);
        User user = userService.getUserByUsername(username);

        List<UserAnswer> wrongAnswers = userAnswerRepository.findByUserIdAndIsCorrectAndProblemType(
                user.getId(), false, problemType);

        List<Map<String, Object>> response = wrongAnswers.stream().map(ua -> {
            Map<String, Object> map = Map.of(
                "id", ua.getId(),
                "problemType", ua.getProblemType(),
                "referenceId", ua.getReferenceId(),
                "problemTitle", ua.getProblemQuestion() != null ? ua.getProblemQuestion() : "문제를 찾을 수 없습니다",
                "submittedAnswer", ua.getSubmittedAnswer(),
                "correctAnswer", ua.getCorrectAnswer() != null ? ua.getCorrectAnswer() : "정답을 찾을 수 없습니다",
                "submittedAt", ua.getSubmittedAt()
            );
            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }
}