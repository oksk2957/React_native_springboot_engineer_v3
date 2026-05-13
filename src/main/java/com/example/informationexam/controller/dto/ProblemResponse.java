package com.example.informationexam.controller.dto;

import com.example.informationexam.domain.problem.Problem;
import com.example.informationexam.domain.problem.ProblemType;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.HashMap;
import java.util.Map;

@Getter
@NoArgsConstructor
public class ProblemResponse {
    private Long id;
    private String question;
    private Map<String, String> options;
    private String correctAnswer;
    private String explanation;
    private String category;
    private String type;
    private int difficulty;
    private boolean isAiGenerated;

    public ProblemResponse(Problem problem) {
        this.id = problem.getId();
        this.question = problem.getQuestion();
        this.correctAnswer = problem.getAnswer();
        this.explanation = problem.getExplanation();
        this.category = problem.getSubject() != null ? problem.getSubject().getName() : "";
        this.type = problem.getType();
        this.difficulty = problem.getDifficulty();
        this.isAiGenerated = problem.isAiGenerated();

        this.options = new HashMap<>();
        if ("OBJECTIVE".equals(problem.getType())) {
            if (problem.getOption1() != null) options.put("1", problem.getOption1());
            if (problem.getOption2() != null) options.put("2", problem.getOption2());
            if (problem.getOption3() != null) options.put("3", problem.getOption3());
            if (problem.getOption4() != null) options.put("4", problem.getOption4());
            if (problem.getOption5() != null) options.put("5", problem.getOption5());
        }
    }
}
