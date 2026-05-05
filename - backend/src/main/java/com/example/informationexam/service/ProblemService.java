package com.example.informationexam.service;

import com.example.informationexam.domain.problem.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class ProblemService {

    private final ProblemRepository problemRepository;

    public List<Map<String, Object>> getRandomProblems(int limit) {
        List<Problem> problems = problemRepository.findRandomProblems(limit);
        return problems.stream().map(this::convertProblemToMap).toList();
    }

    public List<Map<String, Object>> getProblemsByType(ProblemType type, int limit) {
        List<Problem> problems = problemRepository.findAll().stream()
                .filter(p -> p.getType() == type)
                .limit(limit)
                .toList();
        return problems.stream().map(this::convertProblemToMap).toList();
    }

    public Map<String, Object> getProblem(Long id) {
        return convertProblemToMap(problemRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("해당 문제가 존재하지 않습니다. id=" + id)));
    }

    private Map<String, Object> convertProblemToMap(Problem problem) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", problem.getId());
        map.put("question", problem.getQuestion());
        map.put("correctAnswer", problem.getAnswer());
        map.put("explanation", problem.getExplanation());
        map.put("category", problem.getSubject() != null ? problem.getSubject().getName() : "");
        map.put("type", problem.getType().name());
        map.put("difficulty", problem.getDifficulty());
        map.put("isAiGenerated", problem.isAiGenerated());
        return map;
    }

    public boolean checkAnswer(Long problemId, String submittedAnswer) {
        Problem problem = problemRepository.findById(problemId)
                .orElseThrow(() -> new IllegalArgumentException("해당 문제가 존재하지 않습니다. id=" + problemId));
        return problem.getAnswer().equalsIgnoreCase(submittedAnswer);
    }
}
