package com.example.informationexam.domain.user;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Builder;
import jakarta.persistence.*;
import org.hibernate.annotations.ColumnDefault;
import java.time.LocalDateTime;

@Getter
@NoArgsConstructor
@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, name = "google_id")
    private String googleId;

    @Column(unique = true, nullable = false)
    private String email;

    @Column
    private String nickname;

    @Column(nullable = false, length = 32)
    @ColumnDefault("'TRIAL_USER'")
    private String role;

    @Column(name = "free_trial_started_at")
    private LocalDateTime freeTrialStartedAt;

    @Column(name = "free_trial_expires_at")
    private LocalDateTime freeTrialExpiresAt;

    @Column(name = "subscription_started_at")
    private LocalDateTime subscriptionStartedAt;

    @Column(name = "subscription_expires_at")
    private LocalDateTime subscriptionExpiresAt;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column
    private String password;

    @Column(nullable = false)
    @ColumnDefault("'unknown'")
    private String username;

    @Builder
    public User(String googleId, String email, String username, String nickname, String password, String role) {
        this.googleId = googleId;
        this.email = email;
        this.username = username;
        this.nickname = nickname;
        this.password = password;
        this.role = role != null ? role : "TRIAL_USER";
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        this.freeTrialStartedAt = LocalDateTime.now();
        this.freeTrialExpiresAt = LocalDateTime.now().plusDays(7);
    }

    public void updateNickname(String nickname) {
        this.nickname = nickname;
        this.updatedAt = LocalDateTime.now();
    }
    
    public void setRole(String role) {
        this.role = role;
        this.updatedAt = LocalDateTime.now();
    }

    public void updateSubscription(LocalDateTime startedAt, LocalDateTime expiresAt) {
        this.subscriptionStartedAt = startedAt;
        this.subscriptionExpiresAt = expiresAt;
        this.updatedAt = LocalDateTime.now();
    }

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
        if (this.updatedAt == null) {
            this.updatedAt = LocalDateTime.now();
        }
        if (this.freeTrialStartedAt == null) {
            this.freeTrialStartedAt = LocalDateTime.now();
        }
        if (this.freeTrialExpiresAt == null) {
            this.freeTrialExpiresAt = LocalDateTime.now().plusDays(7);
        }
        if (this.role == null) {
            this.role = "TRIAL_USER";
        }
        if (this.username == null) {
            this.username = "unknown";
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
