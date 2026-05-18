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
}

    @PrePersist
    protected void onCreate() {
        if (this.submittedAt == null) {
            this.submittedAt = LocalDateTime.now();
        }
        if (this.isCorrect == null) {
            this.isCorrect = false;
        }
        // sessionId가 null이면 기본 세션 값 설정
        if (this.sessionId == null) {
            // 이 부분은 실제로는 발생하면 안 되지만, 안전성을 위해
            // 사용자 식별이 가능한 경우 기본 세션 생성 로직을 추가할 수 있음
            // 현재는 AnswerService에서 항상 세션을 생성하므로 이 블록은 실행되지 않음
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.submittedAt = LocalDateTime.now();
    }
    
    // Added methods for compatibility with existing code
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