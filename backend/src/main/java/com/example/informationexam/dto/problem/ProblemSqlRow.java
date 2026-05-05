package com.example.informationexam.dto.problem;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * MyBatis XML 조회 결과를 담는 DB 로우 매핑용 타입( 서비스 레이어에서 API DTO로 변환).
 */
@Getter
@Setter
@NoArgsConstructor
public class ProblemSqlRow {
    private Long id;
    private String question;
    private String answer;
    private String explanation;
    private String type;
    private Integer difficulty;
    private String option1;
    private String option2;
    private String option3;
    private String option4;
    private String option5;
    private Boolean isAiGenerated;
    /** subject.name 조인 결과로 사용 */
    private String subjectName;
}
