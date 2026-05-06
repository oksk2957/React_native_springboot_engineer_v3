package com.informationexam.service;

import com.informationexam.dao.UserStatisticsDAO;
import com.informationexam.model.UserStatistics;
import java.util.List;

public class UserStatisticsService {
    private UserStatisticsDAO userStatisticsDAO;

    public void setUserStatisticsDAO(UserStatisticsDAO userStatisticsDAO) {
        this.userStatisticsDAO = userStatisticsDAO;
    }

    public List<UserStatistics> getAllStatistics() {
        return userStatisticsDAO.findAll();
    }

    public UserStatistics getStatisticsById(Long id) {
        return userStatisticsDAO.findById(id);
    }

    public UserStatistics getStatisticsByUserAndSubjectAndBranch(Long userId, Long subjectId, String branch) {
        return userStatisticsDAO.findByUserAndSubjectAndBranch(userId, subjectId, branch);
    }

    public void createStatistics(UserStatistics stats) {
        userStatisticsDAO.insert(stats);
    }

    public void updateStatistics(UserStatistics stats) {
        userStatisticsDAO.update(stats);
    }

    public void deleteStatistics(Long id) {
        userStatisticsDAO.delete(id);
    }
}
