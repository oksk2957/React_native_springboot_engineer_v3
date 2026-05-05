package com.example.informationexam.controller;

import com.example.informationexam.controller.dto.AnswerRequest;
import com.example.informationexam.controller.dto.AnswerResponse;
import com.example.informationexam.mapper.ProblemQueryMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/answers")
@RequiredArgsConstructor
public class AnswerController {

    private final ProblemQueryMapper problemQueryMapper;

    @PostMapping
    public AnswerResponse submitAnswer(@RequestBody AnswerRequest answerRequest) {
        Long problemId = answerRequest.getProblemId();
        String submittedAnswer = answerRequest.getSubmittedAnswer();
        String problemType = answerRequest.getProblemType() != null ? answerRequest.getProblemType() : "OBJECTIVE";

        Map<String, Object> result = problemQueryMapper.validateAnswerProc(problemId, submittedAnswer, problemType);
        
        Boolean isCorrect = false;
        String explanation = null;
        String correctAnswer = null;
        
        if (result != null) {
            isCorrect = (Boolean) result.get("is_correct");
            explanation = (String) result.get("explanation");
            correctAnswer = (String) result.get("correct_answer");
        }
        
        return new AnswerResponse(isCorrect != null ? isCorrect : false, explanation, correctAnswer, problemId);
    }
}
