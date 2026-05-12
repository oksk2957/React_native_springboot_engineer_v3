package com.informationexam.model;

import java.sql.Timestamp;

public class UserStatistics {
    private Long id;
    private Long userId;
    private Long subjectId;
    private String branch;
    private Integer totalAttempted;
    private Integer correctCount;
    private Integer incorrectCount;
    private Timestamp lastStudiedAt;
    private Timestamp createdAt;
    private Timestamp updatedAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public Long getSubjectId() { return subjectId; }
    public void setSubjectId(Long subjectId) { this.subjectId = subjectId; }
    public String getBranch() { return branch; }
    public void setBranch(String branch) { this.branch = branch; }
    public Integer getTotalAttempted() { return totalAttempted; }
    public void setTotalAttempted(Integer totalAttempted) { this.totalAttempted = totalAttempted; }
    public Integer getCorrectCount() { return correctCount; }
    public void setCorrectCount(Integer correctCount) { this.correctCount = correctCount; }
    public Integer getIncorrectCount() { return incorrectCount; }
    public void setIncorrectCount(Integer incorrectCount) { this.incorrectCount = incorrectCount; }
    public Timestamp getLastStudiedAt() { return lastStudiedAt; }
    public void setLastStudiedAt(Timestamp lastStudiedAt) { this.lastStudiedAt = lastStudiedAt; }
    public Timestamp getCreatedAt() { return createdAt; }
    public void setCreatedAt(Timestamp createdAt) { this.createdAt = createdAt; }
    public Timestamp getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Timestamp updatedAt) { this.updatedAt = updatedAt; }
}
