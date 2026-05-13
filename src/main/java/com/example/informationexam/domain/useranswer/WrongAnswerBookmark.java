package com.example.informationexam.domain.useranswer;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Builder;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Getter
@NoArgsConstructor
@Entity
@Table(name = "wrong_answer_bookmark")
public class WrongAnswerBookmark {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "item_type", nullable = false, length = 32)
    private String itemType;

    @Column(name = "reference_id", nullable = false)
    private Long referenceId;

    @Column(name = "bookmarked_at", nullable = false)
    private LocalDateTime bookmarkedAt;

    @Column(name = "review_count", nullable = false)
    private Integer reviewCount;

    @Column(name = "last_reviewed_at")
    private LocalDateTime lastReviewedAt;

    @Builder
    public WrongAnswerBookmark(Long userId, String itemType, Long referenceId) {
        this.userId = userId;
        this.itemType = itemType;
        this.referenceId = referenceId;
        this.bookmarkedAt = LocalDateTime.now();
        this.reviewCount = 0;
    }

    public void incrementReviewCount() {
        this.reviewCount++;
        this.lastReviewedAt = LocalDateTime.now();
    }
}
