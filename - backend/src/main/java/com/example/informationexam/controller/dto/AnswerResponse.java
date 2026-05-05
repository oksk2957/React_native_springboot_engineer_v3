package com.example.informationexam.controller.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class AnswerResponse {
    private boolean isCorrect;
    private String explanation;
    private String correctAnswer;
    private Long problemId;

    public AnswerResponse(boolean isCorrect, String explanation, String correctAnswer, Long problemId) {
        this.isCorrect = isCorrect;
        this.explanation = explanation;
        this.correctAnswer = correctAnswer;
        this.problemId = problemId;
    }
}
