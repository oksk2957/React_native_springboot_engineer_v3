package com.example.informationexam.domain.useranswer;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Builder;
import jakarta.persistence.*;
import java.time.LocalDateTime;

import com.example.informationexam.domain.user.User;

@Getter
@NoArgsConstructor
@Entity
@Table(name = "user_answer")
public class UserAnswer {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "session_id", nullable = false)
    private Long sessionId;

    @Column(name = "item_type", nullable = false, length = 32)
    private String itemType;

    @Column(name = "reference_id", nullable = false)
    private Long referenceId;

    @Column(name = "submitted_answer", nullable = false, length = 4000)
    private String submittedAnswer;

    @Column(name = "is_correct", nullable = false)
    private Boolean isCorrect;

    @Column(name = "submitted_at", nullable = false)
    private LocalDateTime submittedAt;

    @Builder
    public UserAnswer(Long userId, Long sessionId, String itemType, Long referenceId, 
                      String submittedAnswer, Boolean isCorrect) {
        this.userId = userId;
        this.sessionId = sessionId;
        this.itemType = itemType;
        this.referenceId = referenceId;
        this.submittedAnswer = submittedAnswer;
        this.isCorrect = isCorrect != null ? isCorrect : false;
        this.submittedAt = LocalDateTime.now();
    }

    @PrePersist
    protected void onCreate() {
        if (this.submittedAt == null) {
            this.submittedAt = LocalDateTime.now();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.submittedAt = LocalDateTime.now();
    }
}
