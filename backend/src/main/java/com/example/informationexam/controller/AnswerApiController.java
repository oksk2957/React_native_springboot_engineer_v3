package com.example.informationexam.controller;

import com.example.informationexam.controller.dto.AnswerRequest;
import com.example.informationexam.service.AnswerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/answers")
@RequiredArgsConstructor
public class AnswerApiController {

    private final AnswerService answerService;

    @PostMapping("/submit")
    public ResponseEntity<Map<String, Object>> submitAnswer(@RequestBody AnswerRequest request,
                                                       @AuthenticationPrincipal UserDetails userDetails) {
        String username = (userDetails != null) ? userDetails.getUsername() : null;
        return ResponseEntity.ok(answerService.submitAnswer(request, username));
    }
}
