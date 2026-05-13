package com.example.informationexam.domain.problem;

/**
 * 저장소 분기(객관식 problem / 주관식 subjective_problems / 프로그래밍 programming_language_problems)를
 * user_answer·세션·통계 등에서 식별할 때 사용합니다.
 */
public enum ProblemBranch {
    OBJECTIVE,
    SUBJECTIVE,
    PROGRAMMING_LANGUAGE
}
