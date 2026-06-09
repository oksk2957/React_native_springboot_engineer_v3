package com.example.informationexam.dto.statistics;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

// DEBUG: [2026-06-09-수정계획안11] 문제별 오답 랭킹 DTO로 변경 (사용자가 가장 많이 틀린 문제 순위)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class WrongAnswerRankingRow {
    private Long problemId;        // 문제 ID
    private String itemType;       // 문제 유형 (OBJECTIVE, SUBJECTIVE, PROGRAMMING_LANGUAGE)
    private Long referenceId;      // 문제 참조 ID (itemType에 따라 다른 테이블의 ID)
    private String subject;        // 과목명
    private String questionText;   // 문제 내용 (앞 60자)
    private Integer wrongCount;    // 오답 횟수
}
