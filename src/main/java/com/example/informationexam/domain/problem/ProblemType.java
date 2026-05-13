package com.example.informationexam.domain.problem;

/**
 * 문제 유형을 정의하는 Enum입니다.
 *
 * <p>
 *   - OBJECTIVE : 객관식 (문제 테이블)
 *   - SUBJECTIVE : 주관식 (subjective_problems 테이블)
 *   - PROGRAMMING_LANGUAGE : 프로그래밍 (programming_language_problems 테이블)
 * </p>
 */
public enum ProblemType {
    OBJECTIVE,           // 객관식
    SUBJECTIVE,          // 주관식
    PROGRAMMING_LANGUAGE // 프로그래밍
}