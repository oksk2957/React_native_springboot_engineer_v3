package com.example.informationexam.domain.useranswer;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Builder;
import lombok.Setter;
import jakarta.persistence.*;
import java.time.LocalDateTime;

import com.example.informationexam.domain.user.User;
import com.example.informationexam.domain.problem.Problem;
import com.example.informationexam.domain.problem.ProgrammingLanguageProblem;
import com.example.informationexam.domain.problem.SubjectiveProblem;

@Getter
@NoArgsConstructor
@Entity
@Table(name = "user_answer")
public class UserAnswer {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // 문제 유형 (OBJECTIVE, SUBJECTIVE, PROGRAMMING_LANGUAGE)
    @Column(name = "problem_type", nullable = false, length = 32)
    private String problemType;

    // 각 문제 테이블의 ID를 참조 (problem_id -> reference_id)
    @Column(name = "reference_id", nullable = false)
    private Long referenceId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id")
    private StudySession session;

    @Column(name = "submitted_answer", nullable = false, length = 1000)
    private String submittedAnswer;

    @Column(name = "is_correct", nullable = false)
    private boolean isCorrect;

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;

    // 연관된 Problem 객체 (조회용, DB 컬럼 아님)
    @Transient
    private Problem problem;

    @Transient
    private SubjectiveProblem subjectiveProblem;

    @Transient
    private ProgrammingLanguageProblem programmingLanguageProblem;

    @Builder
    public UserAnswer(User user, String problemType, Long referenceId, StudySession session, 
                      String submittedAnswer, boolean isCorrect) {
        this.user = user;
        this.problemType = problemType;
        this.referenceId = referenceId;
        this.session = session;
        this.submittedAnswer = submittedAnswer;
        this.isCorrect = isCorrect;
        this.submittedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.submittedAt = LocalDateTime.now();
    }

    // 문제 유형별 참조 ID getter
    public Long getProblemId() {
        return referenceId;
    }

    // 문제 유형에 따른 문제 객체 조회
    public Object getProblemEntity() {
        switch (problemType) {
            case "OBJECTIVE":
                return problem;
            case "SUBJECTIVE":
                return subjectiveProblem;
            case "PROGRAMMING_LANGUAGE":
                return programmingLanguageProblem;
            default:
                return null;
        }
    }

    // 문제 텍스트 조회
    public String getProblemQuestion() {
        switch (problemType) {
            case "OBJECTIVE":
                return problem != null ? problem.getQuestion() : null;
            case "SUBJECTIVE":
                return subjectiveProblem != null ? subjectiveProblem.getQuestion() : null;
            case "PROGRAMMING_LANGUAGE":
                return programmingLanguageProblem != null ? programmingLanguageProblem.getQuestion() : null;
            default:
                return null;
        }
    }

    // 정답 조회
    public String getCorrectAnswer() {
        switch (problemType) {
            case "OBJECTIVE":
                return problem != null ? problem.getAnswer() : null;
            case "SUBJECTIVE":
                return subjectiveProblem != null ? subjectiveProblem.getAnswer() : null;
            case "PROGRAMMING_LANGUAGE":
                return programmingLanguageProblem != null ? programmingLanguageProblem.getAnswer() : null;
            default:
                return null;
        }
    }
}