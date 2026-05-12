package com.informationexam.dao;

import com.informationexam.model.Subject;
import java.util.List;

public interface SubjectDAO {
    List<Subject> findAll();
    Subject findById(Long id);
    void insert(Subject subject);
    void update(Subject subject);
    void delete(Long id);
}
