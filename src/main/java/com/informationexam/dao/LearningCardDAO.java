package com.informationexam.dao;

import com.informationexam.model.LearningCard;
import java.util.List;

public interface LearningCardDAO {
    List<LearningCard> findAll();
    LearningCard findById(Long id);
    List<LearningCard> findBySubjectId(Long subjectId);
    void insert(LearningCard card);
    void update(LearningCard card);
    void delete(Long id);
}
