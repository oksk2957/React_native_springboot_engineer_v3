package com.informationexam.model;

import java.sql.Timestamp;

public class WrongAnswerBookmark {
    private Long id;
    private Long userId;
    private String itemType;
    private Long referenceId;
    private Timestamp bookmarkedAt;
    private Integer reviewCount;
    private Timestamp lastReviewedAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getItemType() { return itemType; }
    public void setItemType(String itemType) { this.itemType = itemType; }
    public Long getReferenceId() { return referenceId; }
    public void setReferenceId(Long referenceId) { this.referenceId = referenceId; }
    public Timestamp getBookmarkedAt() { return bookmarkedAt; }
    public void setBookmarkedAt(Timestamp bookmarkedAt) { this.bookmarkedAt = bookmarkedAt; }
    public Integer getReviewCount() { return reviewCount; }
    public void setReviewCount(Integer reviewCount) { this.reviewCount = reviewCount; }
    public Timestamp getLastReviewedAt() { return lastReviewedAt; }
    public void setLastReviewedAt(Timestamp lastReviewedAt) { this.lastReviewedAt = lastReviewedAt; }
}
