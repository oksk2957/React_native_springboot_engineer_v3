package com.informationexam.dao;

import com.informationexam.model.ProgrammingLanguageProblems;
import java.util.List;

public interface ProgrammingLanguageProblemsDAO {
    List<ProgrammingLanguageProblems> findAll();
    ProgrammingLanguageProblems findById(Long id);
    List<ProgrammingLanguageProblems> findBySubjectId(Long subjectId);
    void insert(ProgrammingLanguageProblems problem);
    void update(ProgrammingLanguageProblems problem);
    void delete(Long id);
}
