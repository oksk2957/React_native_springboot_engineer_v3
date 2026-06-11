package com.example.informationexam.domain.problem;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Builder;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Getter
@NoArgsConstructor
@Entity
@Table(name = "problem")
public class Problem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 1000)
    private String question;

    @Column(nullable = false, length = 500)
    private String answer;

    @Column(length = 2000)
    private String explanation;

    // 문제 유형: OBJECTIVE (객관식)만 허용 (DB에서 constraint로 enforced)
    @Column(nullable = false)
    private String type = "OBJECTIVE";

    private int difficulty;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subject_id")
    private Subject subject;

    private String option1;
    private String option2;
    private String option3;
    private String option4;
    private String option5;

    // DEBUG: [수정42-2026-06-11] nullable=false 제거 — ddl-auto=update 시 ALTER 실패 방지
    @Column(name = "is_ai_generated")
    private boolean isAiGenerated = false;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Builder
    public Problem(String question, String answer, String explanation,
                   String type, int difficulty, Subject subject,
                   String option1, String option2, String option3, String option4, String option5,
                   boolean isAiGenerated) {
        this.question = question;
        this.answer = answer;
        this.explanation = explanation;
        this.type = type != null ? type : "OBJECTIVE"; // 항상 OBJECTIVE
        this.difficulty = difficulty;
        this.subject = subject;
        this.option1 = option1;
        this.option2 = option2;
        this.option3 = option3;
        this.option4 = option4;
        this.option5 = option5;
        this.isAiGenerated = isAiGenerated;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public String getQuestion() {
        return question;
    }
    
    // 문제 유형 getter
    public String getType() {
        return type != null ? type : "OBJECTIVE";
    }
}