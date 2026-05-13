package com.example.informationexam.domain.problem;

import java.util.List;

public interface ProblemRepositoryCustom {
    List<Problem> findProblemsByDifficultyAndCategory(int difficulty, String category);
}