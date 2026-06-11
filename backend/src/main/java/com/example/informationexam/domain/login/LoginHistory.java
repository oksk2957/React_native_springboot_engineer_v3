package com.example.informationexam.domain.login;

import jakarta.persistence.*;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;

// DEBUG: [수정41-2026-06-11] login_history 테이블 매핑 — 로그인 출석 기록용
@Getter
@NoArgsConstructor
@Entity
@Table(name = "login_history")
public class LoginHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "login_date", nullable = false)
    private LocalDate loginDate;

    @Column(name = "logged_in_at", nullable = false)
    private LocalDateTime loggedInAt;

    @Builder
    public LoginHistory(Long userId, LocalDate loginDate) {
        this.userId = userId;
        this.loginDate = loginDate;
        this.loggedInAt = LocalDateTime.now();
    }

    @PrePersist
    protected void onCreate() {
        if (this.loggedInAt == null) {
            this.loggedInAt = LocalDateTime.now();
        }
    }
}
