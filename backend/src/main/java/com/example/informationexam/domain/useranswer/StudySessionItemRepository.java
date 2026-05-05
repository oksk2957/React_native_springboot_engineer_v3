package com.example.informationexam.domain.useranswer;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface StudySessionItemRepository extends JpaRepository<StudySessionItem, Long> {
    List<StudySessionItem> findBySessionId(Long sessionId);
    
    List<StudySessionItem> findBySessionIdOrderByItemOrder(Long sessionId);
}
