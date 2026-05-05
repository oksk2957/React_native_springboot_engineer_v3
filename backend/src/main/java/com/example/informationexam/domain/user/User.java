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

    @Column(unique = true)
    private String email;

    @Column(name = "google_id")
    private String googleId;

    @ColumnDefault("'unknown'")
    @Column(nullable = false)
    private String username;

    @Column
    private String nickname;

    @Column
    private String password;

    @Column(nullable = false)
    private String role;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // 결제 및 무료 체험 관리 컬럼 추가
    private LocalDateTime freeTrialStartedAt;
    private LocalDateTime subscriptionStartedAt;

    @Builder
    public User(String googleId, String username, String nickname, String password, String email, String role) {
        this.googleId = googleId;
        this.username = username;
        this.nickname = nickname;
        this.password = password;
        this.email = email;
        this.role = role;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public void updateNickname(String nickname) {
        this.nickname = nickname;
        this.updatedAt = LocalDateTime.now();
    }
    
    public void setRole(String role) {
        this.role = role;
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
    
    // Getters for Lombok compatibility
    public Long getId() {
        return id;
    }
    
    public String getEmail() {
        return email;
    }
    
    public String getGoogleId() {
        return googleId;
    }
    
    public String getUsername() {
        return username;
    }
    
    public String getNickname() {
        return nickname;
    }
    
    public String getPassword() {
        return password;
    }
    
    public String getRole() {
        return role;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
    
    public LocalDateTime getFreeTrialStartedAt() {
        return freeTrialStartedAt;
    }
    
    public LocalDateTime getSubscriptionStartedAt() {
        return subscriptionStartedAt;
    }
}