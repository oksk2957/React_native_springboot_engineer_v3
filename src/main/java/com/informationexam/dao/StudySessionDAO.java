package com.informationexam.dao;

import com.informationexam.model.StudySession;
import java.util.List;

public interface StudySessionDAO {
    List<StudySession> findAll();
    StudySession findById(Long id);
    List<StudySession> findByUserId(Long userId);
    void insert(StudySession session);
    void update(StudySession session);
    void delete(Long id);
}
