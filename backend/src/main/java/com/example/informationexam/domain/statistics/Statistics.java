package com.example.informationexam.domain.statistics;

import com.example.informationexam.domain.user.User;
import jakarta.persistence.*;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 통합 통계 테이블
 * 3개 줄기(객관식/주관식/프로그래밍)의 문제 풀이 통계를 관리
 */
@Getter
@NoArgsConstructor
@Entity
@Table(name = "statistics", indexes = {
    @Index(name = "idx_statistics_user_id", columnList = "user_id"),
    @Index(name = "idx_statistics_problem_type", columnList = "problem_type"),
    @Index(name = "idx_statistics_reference_id", columnList = "reference_id")
})
public class Statistics {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "problem_type", nullable = false, length = 32)
    private String problemType;

    @Column(name = "reference_id", nullable = false)
    private Long referenceId;

    @Column(name = "is_correct", nullable = false)
    private boolean isCorrect;

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;

    @Builder
    public Statistics(User user, String problemType, Long referenceId, boolean isCorrect) {
        this.user = user;
        this.problemType = problemType;
        this.referenceId = referenceId;
        this.isCorrect = isCorrect;
        this.submittedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.submittedAt = LocalDateTime.now();
    }
}