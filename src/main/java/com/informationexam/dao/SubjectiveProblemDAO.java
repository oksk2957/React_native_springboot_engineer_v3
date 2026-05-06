package com.informationexam.dao;

import com.informationexam.model.SubjectiveProblem;
import java.util.List;

public interface SubjectiveProblemDAO {
    List<SubjectiveProblem> findAll();
    SubjectiveProblem findById(Long id);
    List<SubjectiveProblem> findBySubjectId(Long subjectId);
    void insert(SubjectiveProblem subjectiveProblem);
    void update(SubjectiveProblem subjectiveProblem);
    void delete(Long id);
}