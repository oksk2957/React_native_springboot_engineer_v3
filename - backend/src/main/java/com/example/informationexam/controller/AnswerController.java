package com.example.informationexam.controller;

import com.example.informationexam.controller.dto.AnswerRequest;
import com.example.informationexam.controller.dto.AnswerResponse;
import com.example.informationexam.service.ProblemService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/answers")
@RequiredArgsConstructor
public class AnswerController {

    private final ProblemService problemService;

    @PostMapping
    public ResponseEntity<AnswerResponse> submitAnswer(@RequestBody AnswerRequest answerRequest) {
        Long problemId = answerRequest.getProblemId();
        String submittedAnswer = answerRequest.getSubmittedAnswer();
        boolean isCorrect = problemService.checkAnswer(problemId, submittedAnswer);
        Problem problem = problemRepository.findById(problemId).orElseThrow(() -> new IllegalArgumentException("해당 문제가 존재하지 않습니다. id=" + problemId));
        return ResponseEntity.ok(new AnswerResponse(isCorrect, problem.getExplanation(), problem.getAnswer(), problemId));
    }
}
