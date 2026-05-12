
package com.example.informationexam.domain.problem;

import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;

import java.util.List;
import static com.example.informationexam.domain.problem.QProblem.problem;

@RequiredArgsConstructor
public class ProblemRepositoryImpl implements ProblemRepositoryCustom {
    private final JPAQueryFactory queryFactory;

    @Override
    public List<Problem> findProblemsByDifficultyAndCategory(int difficulty, String category) {
        return queryFactory
                .selectFrom(problem)
                .where(
                    difficultyEq(difficulty),
                    categoryEq(category)
                )
                .fetch();
    }

    private BooleanExpression difficultyEq(int difficulty) {
        return difficulty != 0 ? problem.difficulty.eq(difficulty) : null;
    }

    private BooleanExpression categoryEq(String category) {
        // Problem 엔티티에는 category 필드가 없고, subject.name을 통해 카테고리 구분
        return category != null && !category.isEmpty() ? problem.subject.name.eq(category) : null;
    }
}
