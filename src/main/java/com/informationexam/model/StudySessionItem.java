package com.informationexam.model;

import java.sql.Timestamp;

public class StudySessionItem {
    private Long id;
    private Long sessionId;
    private String itemType;
    private Long referenceId;
    private Long subjectId;
    private Integer itemOrder;
    private Timestamp presentedAt;
    private Timestamp answeredAt;
    private Boolean isAnswered;
    private Boolean isCorrect;
    private String userSubmittedAnswer;
    private Boolean bookmarkedWrong;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getSessionId() { return sessionId; }
    public void setSessionId(Long sessionId) { this.sessionId = sessionId; }
    public String getItemType() { return itemType; }
    public void setItemType(String itemType) { this.itemType = itemType; }
    public Long getReferenceId() { return referenceId; }
    public void setReferenceId(Long referenceId) { this.referenceId = referenceId; }
    public Long getSubjectId() { return subjectId; }
    public void setSubjectId(Long subjectId) { this.subjectId = subjectId; }
    public Integer getItemOrder() { return itemOrder; }
    public void setItemOrder(Integer itemOrder) { this.itemOrder = itemOrder; }
    public Timestamp getPresentedAt() { return presentedAt; }
    public void setPresentedAt(Timestamp presentedAt) { this.presentedAt = presentedAt; }
    public Timestamp getAnsweredAt() { return answeredAt; }
    public void setAnsweredAt(Timestamp answeredAt) { this.answeredAt = answeredAt; }
    public Boolean getIsAnswered() { return isAnswered; }
    public void setIsAnswered(Boolean isAnswered) { this.isAnswered = isAnswered; }
    public Boolean getIsCorrect() { return isCorrect; }
    public void setIsCorrect(Boolean isCorrect) { this.isCorrect = isCorrect; }
    public String getUserSubmittedAnswer() { return userSubmittedAnswer; }
    public void setUserSubmittedAnswer(String userSubmittedAnswer) { this.userSubmittedAnswer = userSubmittedAnswer; }
    public Boolean getBookmarkedWrong() { return bookmarkedWrong; }
    public void setBookmarkedWrong(Boolean bookmarkedWrong) { this.bookmarkedWrong = bookmarkedWrong; }
}
