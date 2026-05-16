package com.example.informationexam.domain.useranswer;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface WrongAnswerBookmarkRepository extends JpaRepository<WrongAnswerBookmark, Long> {
    List<WrongAnswerBookmark> findByUserId(Long userId);
    
    List<WrongAnswerBookmark> findByUserIdAndItemType(Long userId, String itemType);
    
    Optional<WrongAnswerBookmark> findByUserIdAndItemTypeAndReferenceId(Long userId, String itemType, Long referenceId);
    
    boolean existsByUserIdAndItemTypeAndReferenceId(Long userId, String itemType, Long referenceId);

    @Query("SELECT w FROM WrongAnswerBookmark w WHERE w.userId = :userId AND w.bookmarkedAt >= :start AND w.bookmarkedAt < :end ORDER BY w.bookmarkedAt DESC")
    List<WrongAnswerBookmark> findByUserIdAndBookmarkedAtBetween(
            @Param("userId") Long userId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);
}
