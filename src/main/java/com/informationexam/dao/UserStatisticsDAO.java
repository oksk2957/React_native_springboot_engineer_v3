package com.informationexam.dao;

import com.informationexam.model.UserStatistics;
import java.util.List;

public interface UserStatisticsDAO {
    List<UserStatistics> findAll();
    UserStatistics findById(Long id);
    UserStatistics findByUserAndSubjectAndBranch(Long userId, Long subjectId, String branch);
    void insert(UserStatistics stats);
    void update(UserStatistics stats);
    void delete(Long id);
}
