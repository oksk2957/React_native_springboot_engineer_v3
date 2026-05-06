package com.informationexam.service;

import com.informationexam.dao.SubjectDAO;
import com.informationexam.model.Subject;
import java.util.List;

public class SubjectService {
    private SubjectDAO subjectDAO;

    public void setSubjectDAO(SubjectDAO subjectDAO) {
        this.subjectDAO = subjectDAO;
    }

    public List<Subject> getAllSubjects() {
        return subjectDAO.findAll();
    }

    public Subject getSubjectById(Long id) {
        return subjectDAO.findById(id);
    }

    public void createSubject(Subject subject) {
        subjectDAO.insert(subject);
    }

    public void updateSubject(Subject subject) {
        subjectDAO.update(subject);
    }

    public void deleteSubject(Long id) {
        subjectDAO.delete(id);
    }
}
