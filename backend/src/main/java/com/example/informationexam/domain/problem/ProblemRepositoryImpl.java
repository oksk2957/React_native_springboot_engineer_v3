package com.example.informationexam.domain.problem;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * DEBUG: [2026-05-26] QueryDSL 의존성 제거 - Q 클래스 생성 문제 해결
 * 기존 QueryDSL Q 클래스 의존성을 제거하고 순수 JPA로 대체
 */
@Repository
public class ProblemRepositoryImpl implements ProblemRepositoryCustom {

    @PersistenceContext
    private EntityManager entityManager;

    @Override
    public List<Problem> findProblemsByDifficultyAndCategory(int difficulty, String category) {
        // DEBUG: [2026-05-26] QueryDSL Q 클래스 대신 JPQL 사용
        StringBuilder jpql = new StringBuilder("SELECT p FROM Problem p JOIN p.subject s WHERE 1=1");
        
        if (difficulty != 0) {
            jpql.append(" AND p.difficulty = :difficulty");
        }
        
        if (category != null && !category.isEmpty()) {
            jpql.append(" AND s.name = :category");
        }
        
        var query = entityManager.createQuery(jpql.toString(), Problem.class);
        
        if (difficulty != 0) {
            query.setParameter("difficulty", difficulty);
        }
        
        if (category != null && !category.isEmpty()) {
            query.setParameter("category", category);
        }
        
        return query.getResultList();
    }
}
