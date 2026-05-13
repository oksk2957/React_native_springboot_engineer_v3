package com.example.informationexam.dto.statistics;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WrongAnswerListRow {
    private Long id;
    private String problemType;
    private Long referenceId;
    private String question;
    private String correctAnswer;
    private String submittedAnswer;
    private LocalDateTime submittedAt;
}
