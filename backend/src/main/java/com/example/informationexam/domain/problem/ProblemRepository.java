package com.example.informationexam.domain.problem;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface ProblemRepository extends JpaRepository<Problem, Long> {

    @Query("SELECT p FROM Problem p JOIN p.subject s WHERE TRIM(s.name) = TRIM(:category)")
    List<Problem> findTheoryProblemsByCategory(@Param("category") String category);

    @Query("SELECT p.id FROM Problem p JOIN p.subject s WHERE TRIM(s.name) = TRIM(:category) ORDER BY p.id")
    List<Long> findTheoryProblemIdsByCategory(@Param("category") String category);

    long countByType(ProblemType type);

    @Query("SELECT COUNT(p) FROM Problem p JOIN p.subject s WHERE s.name = :categoryName")
    long countBySubjectName(@Param("categoryName") String categoryName);

    @Query(value = "SELECT * FROM problem p JOIN subject s ON p.subject_id = s.id WHERE p.difficulty = ?1 AND TRIM(s.name) = TRIM(?2) ORDER BY RANDOM() LIMIT ?3", nativeQuery = true)
    List<Problem> findProblemsByDifficultyAndCategory(int difficulty, String category, int limit);

    @Query("SELECT p FROM Problem p WHERE (:difficulty = 0 OR p.difficulty = :difficulty) AND (:category IS NULL OR TRIM(p.subject.name) = TRIM(:category))")
    List<Problem> findProblemsByDifficultyAndCategoryJPQL(@Param("difficulty") int difficulty, @Param("category") String category);

    @Query(value = "SELECT * FROM problem ORDER BY RANDOM() LIMIT ?1", nativeQuery = true)
    List<Problem> findRandomProblems(int limit);

    @Query(value = "SELECT * FROM problem WHERE type = ?1 ORDER BY RANDOM() LIMIT ?2", nativeQuery = true)
    List<Problem> findRandomProblemsByType(ProblemType type, int limit);
}