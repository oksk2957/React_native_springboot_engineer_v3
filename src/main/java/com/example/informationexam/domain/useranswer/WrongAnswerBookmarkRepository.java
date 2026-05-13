package com.example.informationexam.domain.useranswer;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface WrongAnswerBookmarkRepository extends JpaRepository<WrongAnswerBookmark, Long> {
    List<WrongAnswerBookmark> findByUserId(Long userId);
    
    List<WrongAnswerBookmark> findByUserIdAndItemType(Long userId, String itemType);
    
    Optional<WrongAnswerBookmark> findByUserIdAndItemTypeAndReferenceId(Long userId, String itemType, Long referenceId);
    
    boolean existsByUserIdAndItemTypeAndReferenceId(Long userId, String itemType, Long referenceId);
}
