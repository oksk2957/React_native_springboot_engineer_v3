package com.example.informationexam.domain.problem;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SubjectiveProblemRepository extends JpaRepository<SubjectiveProblem, Long> {

    @Query(value = "SELECT COUNT(DISTINCT ua.reference_id) FROM user_answer ua WHERE ua.user_id = :userId AND ua.problem_type = 'SUBJECTIVE'", nativeQuery = true)
    long countDistinctSolvedByUserId(@Param("userId") long userId);
}
