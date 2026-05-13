package com.example.informationexam.domain.problem;

import org.springframework.data.jpa.repository.JpaRepository;

public interface SubjectiveProblemRepository extends JpaRepository<SubjectiveProblem, Long> {
    long count();
}