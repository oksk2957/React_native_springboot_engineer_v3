package com.example.informationexam.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;
import java.util.Map;

@Mapper
public interface ProblemQueryMapper {
    // ★ Map 반환으로 변경 (XML에서 alias로 DTO 필드와 매핑)
    Map<String, Object> selectById(@Param("id") Long id);
    List<Map<String, Object>> selectRandomProblems(@Param("limit") int limit);
    List<Map<String, Object>> selectRandomProblemsByType(@Param("type") String type, @Param("limit") int limit);
    List<Map<String, Object>> selectTheoryProblemsByCategory(@Param("category") String category);
    List<Long> selectTheoryProblemIdsByCategory(@Param("category") String category);
    List<Long> selectStudyIdsByDifficultyCategory(@Param("difficulty") int difficulty, @Param("category") String category, @Param("limit") int limit);
    List<Long> selectStudyIdsByType(@Param("type") String type, @Param("limit") int limit);
    List<Long> selectRandomProblemIds(@Param("limit") int limit, @Param("excludeCategories") List<String> excludeCategories);
    String selectRandomCategoryName(@Param("excludeCategories") List<String> excludeCategories);
    List<Long> selectRandomProblemIdsByCategory(@Param("category") String category, @Param("limit") int limit);
    List<Map<String, Object>> selectOneRandomProblemPerSubject(@Param("type") String type);
    long countAll();
    
    // ★ Stored Procedure 호출용
    Map<String, Object> validateAnswerProc(@Param("p_problem_id") Long problemId, @Param("p_submitted_answer") String submittedAnswer, @Param("p_problem_type") String problemType);
    Map<String, Object> getUserStatisticsProc(@Param("p_user_id") Long userId);
}
