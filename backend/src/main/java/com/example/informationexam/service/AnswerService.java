package com.example.informationexam.service;

import com.example.informationexam.controller.dto.AnswerRequest;
import com.example.informationexam.domain.problem.Problem;
import com.example.informationexam.domain.problem.ProblemRepository;
import com.example.informationexam.domain.user.User;
import com.example.informationexam.domain.user.UserRepository;
import com.example.informationexam.domain.useranswer.UserAnswer;
import com.example.informationexam.domain.useranswer.UserAnswerRepository;
import com.example.informationexam.mapper.ProblemQueryMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AnswerService {

    private final ProblemRepository problemRepository;
    private final ProblemQueryMapper problemQueryMapper;
    private final UserAnswerRepository userAnswerRepository;
    private final UserRepository userRepository;

    @Transactional
    public Map<String, Object> submitAnswer(AnswerRequest request, String username) {
        String problemType = request.getProblemType();
        Long problemId = request.getProblemId();
        
        // 문제 유형별 처리
        Map<String, String> problemInfo = getProblemInfo(problemType, problemId);
        
        if (problemInfo == null || problemInfo.isEmpty()) {
            throw new IllegalArgumentException("해당 문제가 존재하지 않습니다. id=" + problemId + ", type=" + problemType);
        }
        
        String correctAnswer = problemInfo.get("answer");
        String explanation = problemInfo.get("explanation");
        String question = problemInfo.get("question");
        
        // 정답 체크 (대소문자 무시, 공백 제거)
        boolean isCorrect = correctAnswer.trim().equalsIgnoreCase(request.getSubmittedAnswer().trim());
        
        // 사용자가 명시된 경우 DB에 저장
        if (username != null) {
            Optional<User> userOptional = userRepository.findByUsername(username);
            
            if (userOptional.isPresent()) {
                User user = userOptional.get();
                UserAnswer userAnswer = UserAnswer.builder()
                        .userId(user.getId())
                        .itemType(problemType)
                        .referenceId(problemId)
                        .submittedAnswer(request.getSubmittedAnswer())
                        .isCorrect(isCorrect)
                        .build();
                userAnswerRepository.save(userAnswer);
            }
        }
        
        // Map 기반 응답 생성
        Map<String, Object> response = new HashMap<>();
        response.put("isCorrect", isCorrect);
        response.put("explanation", explanation);
        response.put("correctAnswer", correctAnswer);
        response.put("question", question);
        
        return response;
    }

    /**
     * 문제 유형과 ID로 문제를 조회하여 정답, 해설, 문제를 반환
     */
    private Map<String, String> getProblemInfo(String problemType, Long problemId) {
        Map<String, String> info = new HashMap<>();
        
        switch (problemType) {
            case "OBJECTIVE":
                Optional<Problem> problemOpt = problemRepository.findById(problemId);
                if (problemOpt.isPresent()) {
                    Problem problem = problemOpt.get();
                    info.put("answer", problem.getAnswer());
                    info.put("explanation", problem.getExplanation());
                    info.put("question", problem.getQuestion());
                }
                break;
                
            case "SUBJECTIVE":
            case "PROGRAMMING_LANGUAGE":
                // MyBatis mapper 사용
                Map<String, Object> map = problemQueryMapper.selectById(problemId);
                if (map != null && !map.isEmpty()) {
                    info.put("answer", (String) map.get("correct_answer"));
                    info.put("explanation", (String) map.get("explanation"));
                    info.put("question", (String) map.get("question"));
                }
                break;
        }
        
        return info;
    }
}