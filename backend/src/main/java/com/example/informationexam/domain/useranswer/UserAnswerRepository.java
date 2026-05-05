package com.example.informationexam.domain.useranswer;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface UserAnswerRepository extends JpaRepository<UserAnswer, Long> {
    List<UserAnswer> findByUserId(Long userId);
    
    // 기존 problem_id 기반 조회 (호환성 유지)
    @Query("SELECT ua FROM UserAnswer ua WHERE ua.user.id = :userId AND ua.problemType = 'OBJECTIVE' AND ua.referenceId = :problemId")
    Optional<UserAnswer> findByUserIdAndProblemId(@Param("userId") Long userId, @Param("problemId") Long problemId);
    
    // 문제 유형별 조회
    List<UserAnswer> findByUserIdAndProblemType(Long userId, String problemType);
    List<UserAnswer> findByUserIdAndIsCorrectAndProblemType(Long userId, boolean isCorrect, String problemType);
    
    // 기존 방식 호환 (isCorrect만)
    List<UserAnswer> findByUserIdAndIsCorrect(Long userId, boolean isCorrect);
    
    long countByUserId(Long userId);
    long countByUserIdAndIsCorrect(Long userId, boolean isCorrect);
    
    // 문제 유형별 통계
    @Query("SELECT COUNT(ua) FROM UserAnswer ua WHERE ua.user.id = :userId AND ua.problemType = :problemType")
    long countByUserIdAndProblemType(@Param("userId") Long userId, @Param("problemType") String problemType);
    
    @Query("SELECT COUNT(ua) FROM UserAnswer ua WHERE ua.user.id = :userId AND ua.problemType = :problemType AND ua.isCorrect = true")
    long countCorrectByUserIdAndProblemType(@Param("userId") Long userId, @Param("problemType") String problemType);
    
    // 과목별 통계 (OBJECTIVE만 해당, problem 테이블 JOIN)
    @Query("SELECT COUNT(ua) FROM UserAnswer ua " +
           "JOIN Problem p ON ua.referenceId = p.id AND ua.problemType = 'OBJECTIVE' " +
           "JOIN p.subject s WHERE ua.user.id = :userId AND s.name = :categoryName AND ua.isCorrect = true")
    long countCorrectByCategory(@Param("userId") Long userId, @Param("categoryName") String categoryName);

    @Query("SELECT COUNT(ua) FROM UserAnswer ua " +
           "JOIN Problem p ON ua.referenceId = p.id AND ua.problemType = 'OBJECTIVE' " +
           "JOIN p.subject s WHERE ua.user.id = :userId AND s.name = :categoryName")
    long countTotalByCategory(@Param("userId") Long userId, @Param("categoryName") String categoryName);
    
    // 문제 유형별 고유 제약 조회
    Optional<UserAnswer> findByUserIdAndProblemTypeAndReferenceId(Long userId, String problemType, Long referenceId);
}