package com.example.informationexam.controller.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class AnswerRequest {
    private Long problemId;
    private String submittedAnswer;
}
