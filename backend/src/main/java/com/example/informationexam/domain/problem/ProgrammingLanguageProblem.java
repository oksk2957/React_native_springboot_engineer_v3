package com.example.informationexam.domain.problem;

import jakarta.persistence.*;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor
@Entity
@Table(name = "programming_language_problems")
public class ProgrammingLanguageProblem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subject_id")
    private Subject subject;

    @Column(name = "prog_language", nullable = false, length = 64)
    private String programmingLanguage;

    @Column(nullable = false, length = 1000)
    private String question;

    @Column(nullable = false, length = 500)
    private String answer;

    @Column(length = 2000)
    private String explanation;

    private Integer difficulty;

    @Column(name = "option1", length = 500)
    private String option1;

    @Column(name = "option2", length = 500)
    private String option2;

    @Column(name = "option3", length = 500)
    private String option3;

    @Column(name = "option4", length = 500)
    private String option4;

    @Column(name = "option5", length = 500)
    private String option5;

    @Column(nullable = false)
    private boolean isAiGenerated = false;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // DEBUG: [2026-06-09 수정계획안18] option1~5 필드 Builder 추가
    @Builder
    public ProgrammingLanguageProblem(Subject subject, String programmingLanguage, String question, String answer,
                                     String explanation, Integer difficulty, boolean isAiGenerated,
                                     String option1, String option2, String option3, String option4, String option5) {
        this.subject = subject;
        this.programmingLanguage = programmingLanguage;
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
