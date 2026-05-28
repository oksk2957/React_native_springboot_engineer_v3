package com.example.informationexam.domain.useranswer;

import jakarta.persistence.*;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

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

    @Column(name = "session_id", nullable = false, length = 255) // VARCHAR로 변경
    private String sessionId;

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
    public UserAnswer(Long userId, String sessionId, String itemType, Long referenceId,
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
        if (this.sessionId == null) {
            throw new IllegalStateException("sessionId는 필수값입니다.");
        }
        if (this.submittedAt == null) {
            this.submittedAt = LocalDateTime.now();
        }
        if (this.isCorrect == null) {
            this.isCorrect = false;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.submittedAt = LocalDateTime.now();
    }

    // DEBUG: [2026-05-26] 클래스 닫는 중괄호 뒤에 불필요한 메서드가 분리되어 있어 컴파일 오류 수정
    public String getProblemType() {
        return this.itemType;
    }

    public String getProblemQuestion() {
        // This would need to be looked up from the appropriate problem repository
        return null;
    }

    public String getCorrectAnswer() {
        // This would need to be looked up from the appropriate problem repository
        return null;
    }
}
