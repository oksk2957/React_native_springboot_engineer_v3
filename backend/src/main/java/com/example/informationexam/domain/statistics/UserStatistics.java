package com.example.informationexam.domain.statistics;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Builder;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Getter
@NoArgsConstructor
@Entity
@Table(name = "user_statistics")
public class UserStatistics {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "subject_id", nullable = false)
    private Long subjectId;

    @Column(name = "branch", nullable = false, length = 32)
    private String branch;

    @Column(name = "total_attempted", nullable = false)
    private Integer totalAttempted;

    @Column(name = "correct_count", nullable = false)
    private Integer correctCount;

    @Column(name = "incorrect_count", nullable = false)
    private Integer incorrectCount;

    @Column(name = "last_studied_at")
    private LocalDateTime lastStudiedAt;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Builder
    public UserStatistics(Long userId, Long subjectId, String branch) {
        this.userId = userId;
        this.subjectId = subjectId;
        this.branch = branch;
        this.totalAttempted = 0;
        this.correctCount = 0;
        this.incorrectCount = 0;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public void recordAttempt(boolean correct) {
        this.totalAttempted++;
        if (correct) {
            this.correctCount++;
        } else {
            this.incorrectCount++;
        }
        this.lastStudiedAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public double getAccuracyRate() {
        if (this.totalAttempted == 0) {
            return 0.0;
        }
        return (double) this.correctCount / this.totalAttempted * 100;
    }
}
