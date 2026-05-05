package com.example.informationexam.domain.useranswer;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Builder;
import jakarta.persistence.*;
import java.time.LocalDateTime;

import com.example.informationexam.domain.user.User;
import com.example.informationexam.domain.problem.Subject;

@Getter
@NoArgsConstructor
@Entity
@Table(name = "study_session")
public class StudySession {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subject_id", nullable = false)
    private Subject subject;

    @Column(nullable = false)
    private String sessionType;

    @Column(nullable = false)
    private String status;

    @Column(name = "problem_branch", length = 32)
    private String problemBranch;

    private int totalQuestions;
    private int correctCount;
    private int incorrectCount;

    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
    private LocalDateTime createdAt;

    @Builder
    public StudySession(User user, Subject subject, String sessionType, String status) {
        this.user = user;
        this.subject = subject;
        this.sessionType = sessionType;
        this.status = status;
        this.startedAt = LocalDateTime.now();
        this.createdAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.completedAt = LocalDateTime.now();
    }
    
    // Getters for Lombok compatibility
    public Long getId() {
        return id;
    }
    
    public User getUser() {
        return user;
    }
    
    public Subject getSubject() {
        return subject;
    }
    
    public String getSessionType() {
        return sessionType;
    }
    
    public String getStatus() {
        return status;
    }
    
    public int getTotalQuestions() {
        return totalQuestions;
    }
    
    public int getCorrectCount() {
        return correctCount;
    }
    
    public int getIncorrectCount() {
        return incorrectCount;
    }
    
    public LocalDateTime getStartedAt() {
        return startedAt;
    }
    
    public LocalDateTime getCompletedAt() {
        return completedAt;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public String getProblemBranch() {
        return problemBranch;
    }

    public void setProblemBranch(String problemBranch) {
        this.problemBranch = problemBranch;
    }
}
