package com.example.informationexam.domain.statistics;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface StatisticsRepository extends JpaRepository<Statistics, Long> {

    long countByUserIdAndProblemType(Long userId, String problemType);

    long countByUserIdAndProblemTypeAndIsCorrectTrue(Long userId, String problemType);

    List<Statistics> findByUserIdOrderBySubmittedAtDesc(Long userId);

    @Query("SELECT COUNT(DISTINCT s.referenceId) FROM Statistics s WHERE s.user.id = :userId AND s.problemType = :problemType")
    long countDistinctReferenceIdsByUserIdAndProblemType(@Param("userId") Long userId, @Param("problemType") String problemType);
}