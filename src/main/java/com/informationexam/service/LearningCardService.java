package com.informationexam.service;

import com.informationexam.dao.LearningCardDAO;
import com.informationexam.model.LearningCard;
import java.util.List;

public class LearningCardService {
    private LearningCardDAO learningCardDAO;

    public void setLearningCardDAO(LearningCardDAO learningCardDAO) {
        this.learningCardDAO = learningCardDAO;
    }

    public List<LearningCard> getAllCards() {
        return learningCardDAO.findAll();
    }

    public LearningCard getCardById(Long id) {
        return learningCardDAO.findById(id);
    }

    public List<LearningCard> getCardsBySubjectId(Long subjectId) {
        return learningCardDAO.findBySubjectId(subjectId);
    }

    public void createCard(LearningCard card) {
        learningCardDAO.insert(card);
    }

    public void updateCard(LearningCard card) {
        learningCardDAO.update(card);
    }

    public void deleteCard(Long id) {
        learningCardDAO.delete(id);
    }
}
