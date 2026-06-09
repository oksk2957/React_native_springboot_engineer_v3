package com.example.informationexam.dto.statistics;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

// DEBUG: [2026-06-09-수정계획안09] 개인 오답 통계로 변경 - 문제별 오답 횟수 DTO
@Data
@NoArgsConstructor
@AllArgsConstructor
public class WrongAnswerRankingRow {
    private Long problemId;
    private String subject;
    private String questionText;
    private Integer wrongCount;
}
