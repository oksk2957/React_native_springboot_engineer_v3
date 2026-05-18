package com.example.informationexam.domain.useranswer;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserAnswerRepository extends JpaRepository<UserAnswer, Long> {
    List<UserAnswer> findByUserId(Long userId);

    List<UserAnswer> findByUserIdAndItemType(Long userId, String itemType);

    List<UserAnswer> findBySessionId(String sessionId);

    Optional<UserAnswer> findBySessionIdAndReferenceIdAndItemType(String sessionId, Long referenceId, String itemType);

    boolean existsBySessionIdAndReferenceIdAndItemType(String sessionId, Long referenceId, String itemType);

    // Added methods for StatisticsService
    @Query("SELECT COUNT(ua) FROM UserAnswer ua WHERE ua.userId = :userId AND ua.itemType = :problemType")
    long countByUserIdAndProblemType(@Param("userId") Long userId, @Param("problemType") String problemType);

    @Query("SELECT COUNT(ua) FROM UserAnswer ua WHERE ua.userId = :userId AND ua.itemType = :problemType AND ua.isCorrect = true")
    long countCorrectByUserIdAndProblemType(@Param("userId") Long userId, @Param("problemType") String problemType);

    @Query("SELECT COUNT(ua) FROM UserAnswer ua WHERE ua.userId = :userId AND (ua.itemType = 'OBJECTIVE' OR ua.itemType = 'SUBJECTIVE' OR ua.itemType = 'PROGRAMMING_LANGUAGE')")
    long countTotalByCategory(@Param("userId") Long userId);

    @Query("SELECT COUNT(ua) FROM UserAnswer ua WHERE ua.userId = :userId AND ua.itemType = :category")
    long countCorrectByCategory(@Param("userId") Long userId, @Param("category") String category);

    // Added methods for UserAnswerApiController
    List<UserAnswer> findByUserIdAndIsCorrect(Long userId, boolean isCorrect);

    List<UserAnswer> findByUserIdAndIsCorrectAndItemType(Long userId, boolean isCorrect, String itemType);
}
