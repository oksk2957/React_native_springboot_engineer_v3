package com.example.informationexam.controller.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class AnswerRequest {
    // 문제 유형 (OBJECTIVE, SUBJECTIVE, PROGRAMMING_LANGUAGE)
    private String problemType;
    
    // 문제 ID (기존 필드 호환성 유지)
    private Long problemId;
    
    // 제출한 답
    private String submittedAnswer;
}