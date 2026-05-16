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

    @Column(nullable = false)
    private boolean isAiGenerated = false;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Builder
    public ProgrammingLanguageProblem(Subject subject, String programmingLanguage, String question, String answer,
                                     String explanation, Integer difficulty, boolean isAiGenerated) {
        this.subject = subject;
        this.programmingLanguage = programmingLanguage;
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
