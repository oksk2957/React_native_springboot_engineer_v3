package com.example.informationexam.domain.problem;

import java.util.List;

/**
 * DEBUG: [2026-05-26] QueryDSL 커스텀 리포지토리 인터페이스 추가
 * ProblemRepositoryImpl에서 구현하는 커스텀 쿼리 메서드 정의
 */
public interface ProblemRepositoryCustom {
    List<Problem> findProblemsByDifficultyAndCategory(int difficulty, String category);
}
