package com.example.informationexam.domain.useranswer;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Builder;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Getter
@NoArgsConstructor
@Entity
@Table(name = "study_session_item")
public class StudySessionItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "session_id", nullable = false)
    private Long sessionId;

    @Column(name = "item_type", nullable = false, length = 32)
    private String itemType;

    @Column(name = "reference_id", nullable = false)
    private Long referenceId;

    @Column(name = "subject_id", nullable = false)
    private Long subjectId;

    @Column(name = "item_order", nullable = false)
    private Integer itemOrder;

    @Column(name = "presented_at", nullable = false)
    private LocalDateTime presentedAt;

    @Column(name = "answered_at")
    private LocalDateTime answeredAt;

    @Column(name = "is_answered", nullable = false)
    private Boolean isAnswered;

    @Column(name = "is_correct")
    private Boolean isCorrect;

    @Column(name = "user_submitted_answer", length = 4000)
    private String userSubmittedAnswer;

    @Column(name = "bookmarked_wrong", nullable = false)
    private Boolean bookmarkedWrong;

    @Builder
    public StudySessionItem(Long sessionId, String itemType, Long referenceId, Long subjectId, 
                           Integer itemOrder, Boolean isAnswered, Boolean isCorrect,
                           String userSubmittedAnswer, Boolean bookmarkedWrong) {
        this.sessionId = sessionId;
        this.itemType = itemType;
        this.referenceId = referenceId;
        this.subjectId = subjectId;
        this.itemOrder = itemOrder;
        this.presentedAt = LocalDateTime.now();
        this.isAnswered = isAnswered != null ? isAnswered : false;
        this.isCorrect = isCorrect;
        this.userSubmittedAnswer = userSubmittedAnswer;
        this.bookmarkedWrong = bookmarkedWrong != null ? bookmarkedWrong : false;
    }

    public void markAnswered(Boolean correct, String submittedAnswer) {
        this.isAnswered = true;
        this.isCorrect = correct;
        this.userSubmittedAnswer = submittedAnswer;
        this.answeredAt = LocalDateTime.now();
    }

    public void bookmarkAsWrong(Boolean bookmarked) {
        this.bookmarkedWrong = bookmarked;
    }
}
