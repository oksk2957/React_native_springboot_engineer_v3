package com.informationexam.dao;

import com.informationexam.model.Problem;
import java.util.List;

public interface ProblemDAO {
    List<Problem> findAll();
    Problem findById(Long id);
    List<Problem> findBySubjectId(Long subjectId);
    void insert(Problem problem);
    void update(Problem problem);
    void delete(Long id);
}
