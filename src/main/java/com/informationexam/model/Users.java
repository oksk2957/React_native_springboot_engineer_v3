package com.informationexam.model;

import java.sql.Timestamp;

public class Users {
    private Long id;
    private String googleId;
    private String email;
    private String nickname;
    private String role;
    private Timestamp freeTrialStartedAt;
    private Timestamp freeTrialExpiresAt;
    private Timestamp subscriptionStartedAt;
    private Timestamp subscriptionExpiresAt;
    private Timestamp createdAt;
    private Timestamp updatedAt;
    private String password;
    private String username;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getGoogleId() { return googleId; }
    public void setGoogleId(String googleId) { this.googleId = googleId; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getNickname() { return nickname; }
    public void setNickname(String nickname) { this.nickname = nickname; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public Timestamp getFreeTrialStartedAt() { return freeTrialStartedAt; }
    public void setFreeTrialStartedAt(Timestamp freeTrialStartedAt) { this.freeTrialStartedAt = freeTrialStartedAt; }
    public Timestamp getFreeTrialExpiresAt() { return freeTrialExpiresAt; }
    public void setFreeTrialExpiresAt(Timestamp freeTrialExpiresAt) { this.freeTrialExpiresAt = freeTrialExpiresAt; }
    public Timestamp getSubscriptionStartedAt() { return subscriptionStartedAt; }
    public void setSubscriptionStartedAt(Timestamp subscriptionStartedAt) { this.subscriptionStartedAt = subscriptionStartedAt; }
    public Timestamp getSubscriptionExpiresAt() { return subscriptionExpiresAt; }
    public void setSubscriptionExpiresAt(Timestamp subscriptionExpiresAt) { this.subscriptionExpiresAt = subscriptionExpiresAt; }
    public Timestamp getCreatedAt() { return createdAt; }
    public void setCreatedAt(Timestamp createdAt) { this.createdAt = createdAt; }
    public Timestamp getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Timestamp updatedAt) { this.updatedAt = updatedAt; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
}
