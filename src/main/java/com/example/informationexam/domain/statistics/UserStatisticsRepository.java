package com.example.informationexam.domain.statistics;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserStatisticsRepository extends JpaRepository<UserStatistics, Long> {
    List<UserStatistics> findByUserId(Long userId);
    
    List<UserStatistics> findByUserIdAndBranch(Long userId, String branch);
    
    Optional<UserStatistics> findByUserIdAndSubjectIdAndBranch(Long userId, Long subjectId, String branch);
    
    boolean existsByUserIdAndSubjectIdAndBranch(Long userId, Long subjectId, String branch);
}
