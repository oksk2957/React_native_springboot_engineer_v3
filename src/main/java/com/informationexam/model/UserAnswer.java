package com.informationexam.model;

import java.sql.Timestamp;

public class UserAnswer {
    private Long id;
    private Long userId;
    private Long sessionId;
    private String itemType;
    private Long referenceId;
    private String submittedAnswer;
    private Boolean isCorrect;
    private Timestamp submittedAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public Long getSessionId() { return sessionId; }
    public void setSessionId(Long sessionId) { this.sessionId = sessionId; }
    public String getItemType() { return itemType; }
    public void setItemType(String itemType) { this.itemType = itemType; }
    public Long getReferenceId() { return referenceId; }
    public void setReferenceId(Long referenceId) { this.referenceId = referenceId; }
    public String getSubmittedAnswer() { return submittedAnswer; }
    public void setSubmittedAnswer(String submittedAnswer) { this.submittedAnswer = submittedAnswer; }
    public Boolean getIsCorrect() { return isCorrect; }
    public void setIsCorrect(Boolean isCorrect) { this.isCorrect = isCorrect; }
    public Timestamp getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(Timestamp submittedAt) { this.submittedAt = submittedAt; }
}
