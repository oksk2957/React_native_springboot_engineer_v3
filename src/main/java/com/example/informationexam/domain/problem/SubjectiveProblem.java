package com.example.informationexam.domain.problem;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Builder;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Getter
@NoArgsConstructor
@Entity
@Table(name = "subjective_problems")
public class SubjectiveProblem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subject_id")
    private Subject subject;

    @Column(nullable = false, length = 1000)
    private String question;

    @Column(nullable = false, length = 500)
    private String answer;

    @Column(length = 2000)
    private String explanation;

    // DEBUG: [주관식 보기] 주관식 퀴즈를 5개 보기 중 선택하는 형태로 변경
    // 원인: 사용자가 TextInput 대신 5개 보기 버튼 형태로 변경 요청
    // 해결: option1~5 컬럼 추가하여 보기 데이터 저장
    @Column(length = 500)
    private String option1;
    @Column(length = 500)
    private String option2;
    @Column(length = 500)
    private String option3;
    @Column(length = 500)
    private String option4;
    @Column(length = 500)
    private String option5;

    private int difficulty;

    @Column(name = "is_ai_generated", nullable = false)
    private boolean isAiGenerated = false;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Builder
    public SubjectiveProblem(Subject subject, String question, String answer, String explanation,
                              int difficulty, boolean isAiGenerated,
                              String option1, String option2, String option3, String option4, String option5) {
        this.subject = subject;
        this.question = question;
        this.answer = answer;
        this.explanation = explanation;
        this.difficulty = difficulty;
        this.isAiGenerated = isAiGenerated;
        this.option1 = option1;
        this.option2 = option2;
        this.option3 = option3;
        this.option4 = option4;
        this.option5 = option5;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}