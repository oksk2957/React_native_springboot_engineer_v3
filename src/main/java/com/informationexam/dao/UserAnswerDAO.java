package com.informationexam.dao;

import com.informationexam.model.UserAnswer;
import java.util.List;

public interface UserAnswerDAO {
    List<UserAnswer> findAll();
    UserAnswer findById(Long id);
    List<UserAnswer> findBySessionId(Long sessionId);
    void insert(UserAnswer answer);
    void update(UserAnswer answer);
    void delete(Long id);
}
