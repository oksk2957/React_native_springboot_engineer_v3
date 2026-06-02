package com.example.informationexam.domain.useranswer;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserAnswerRepository extends JpaRepository<UserAnswer, Long> {
    List<UserAnswer> findByUserId(Long userId);

    List<UserAnswer> findByUserIdAndItemType(Long userId, String itemType);

    // DEBUG: [2026-05-26] sessionId가 String 타입이므로 파라미터 타입을 String으로 수정
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

    // DEBUG: [오답삭제] 로그인 시 7일 이상 된 오답 기록 삭제
    // 원인: 무료/유료 구분 없이 모든 사용자 동일하게 7일 기준 적용
    // 해결: 순수 SQL 쿼리로 구현 (트리거, 인덱스 없이)
    @Modifying
    @Query(value = "DELETE FROM user_answer WHERE user_id = :userId AND submitted_at < DATEADD('DAY', -7, CURRENT_TIMESTAMP)", nativeQuery = true)
    int deleteOldWrongAnswers(@Param("userId") Long userId);
}
