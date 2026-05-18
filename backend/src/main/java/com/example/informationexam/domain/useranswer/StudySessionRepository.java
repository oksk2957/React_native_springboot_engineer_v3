package com.example.informationexam.domain.useranswer;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface StudySessionRepository extends JpaRepository<StudySession, Long> {
    Optional<StudySession> findBySessionKey(String sessionKey);
    Optional<StudySession> findByUserId(Long userId);
    boolean existsByUserId(Long userId);
}