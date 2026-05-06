package com.informationexam.service;

import com.informationexam.dao.StudySessionItemDAO;
import com.informationexam.model.StudySessionItem;
import java.util.List;

public class StudySessionItemService {
    private StudySessionItemDAO studySessionItemDAO;

    public void setStudySessionItemDAO(StudySessionItemDAO studySessionItemDAO) {
        this.studySessionItemDAO = studySessionItemDAO;
    }

    public List<StudySessionItem> getAllItems() {
        return studySessionItemDAO.findAll();
    }

    public StudySessionItem getItemById(Long id) {
        return studySessionItemDAO.findById(id);
    }

    public List<StudySessionItem> getItemsBySessionId(Long sessionId) {
        return studySessionItemDAO.findBySessionId(sessionId);
    }

    public void createItem(StudySessionItem item) {
        studySessionItemDAO.insert(item);
    }

    public void updateItem(StudySessionItem item) {
        studySessionItemDAO.update(item);
    }

    public void deleteItem(Long id) {
        studySessionItemDAO.delete(id);
    }
}
