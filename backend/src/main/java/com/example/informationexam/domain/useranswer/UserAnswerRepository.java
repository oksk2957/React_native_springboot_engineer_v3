package com.example.informationexam.domain.useranswer;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserAnswerRepository extends JpaRepository<UserAnswer, Long> {
    List<UserAnswer> findByUserId(Long userId);
    
    List<UserAnswer> findByUserIdAndItemType(Long userId, String itemType);
    
    List<UserAnswer> findBySessionId(Long sessionId);
    
    Optional<UserAnswer> findBySessionIdAndReferenceIdAndItemType(Long sessionId, Long referenceId, String itemType);
    
    boolean existsBySessionIdAndReferenceIdAndItemType(Long sessionId, Long referenceId, String itemType);
}
