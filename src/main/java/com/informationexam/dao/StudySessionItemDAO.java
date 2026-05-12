package com.informationexam.dao;

import com.informationexam.model.StudySessionItem;
import java.util.List;

public interface StudySessionItemDAO {
    List<StudySessionItem> findAll();
    StudySessionItem findById(Long id);
    List<StudySessionItem> findBySessionId(Long sessionId);
    void insert(StudySessionItem item);
    void update(StudySessionItem item);
    void delete(Long id);
}
