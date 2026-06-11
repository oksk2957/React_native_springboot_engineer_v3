package com.example.informationexam.domain.login;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

// DEBUG: [수정41-2026-06-11] login_history Repository — 로그인 출석 기록 조회
@Repository
public interface LoginHistoryRepository extends JpaRepository<LoginHistory, Long> {

    /**
     * 특정 사용자의 월별 로그인 기록 조회
     * @param userId 사용자 ID
     * @param startDate 조회 시작일 (예: 2026-06-01)
     * @param endDate 조회 종료일 (예: 2026-06-30)
     * @return 로그인 날짜 리스트
     */
    @Query("SELECT lh.loginDate FROM LoginHistory lh " +
           "WHERE lh.userId = :userId " +
           "AND lh.loginDate BETWEEN :startDate AND :endDate " +
           "ORDER BY lh.loginDate ASC")
    List<LocalDate> findLoginDatesByUserIdAndDateRange(
        @Param("userId") Long userId,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate
    );

    /**
     * 오늘 이미 로그인했는지 확인
     */
    boolean existsByUserIdAndLoginDate(Long userId, LocalDate loginDate);
}
