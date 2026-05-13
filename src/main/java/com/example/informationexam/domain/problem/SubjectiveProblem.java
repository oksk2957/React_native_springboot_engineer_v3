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

    private int difficulty;

    @Column(name = "is_ai_generated", nullable = false)
    private boolean isAiGenerated = false;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Builder
    public SubjectiveProblem(Subject subject, String question, String answer, String explanation,
                              int difficulty, boolean isAiGenerated) {
        this.subject = subject;
        this.question = question;
        this.answer = answer;
        this.explanation = explanation;
        this.difficulty = difficulty;
        this.isAiGenerated = isAiGenerated;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}