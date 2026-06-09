package com.example.informationexam.mapper;

import com.example.informationexam.dto.statistics.ContentTotalsRow;
import com.example.informationexam.dto.statistics.MypageBranchStatRow;
import com.example.informationexam.dto.statistics.ObjectiveCategoryStatRow;
import com.example.informationexam.dto.statistics.WrongAnswerListRow;
import com.example.informationexam.dto.statistics.WrongAnswerRankingRow;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Mapper
public interface MypageStatisticsMapper {

    // DEBUG: NPE 수정 - primitive long을 Long wrapper로 변경하여 null 허용
    Map<String, Object> selectUserAnswerOverall(@Param("userId") Long userId);

    List<MypageBranchStatRow> selectBranchStats(@Param("userId") Long userId);

    List<ObjectiveCategoryStatRow> selectObjectiveCategoryStats(@Param("userId") Long userId);

    ContentTotalsRow selectContentTotals();

    List<WrongAnswerListRow> selectWrongAnswers(@Param("userId") Long userId);

    // DEBUG: [2026-06-07] 과목별 시도 횟수 랭킹 조회
    List<Map<String, Object>> selectSubjectRanking(@Param("userId") Long userId);

    // DEBUG: [2026-06-07] 날짜별 오답 조회 (Optional Auth 패턴 동기화)
    // 수정: String date → LocalDate date로 변경 (컨트롤러와 타입 일치)
    List<WrongAnswerListRow> selectWrongAnswersByDate(@Param("userId") Long userId, @Param("date") LocalDate date);

    // DEBUG: [2026-06-09-수정계획안09] 개인 오답 통계 - 문제별 오답 횟수 (userId 필터링 추가)
    List<WrongAnswerRankingRow> selectWrongAnswerRanking(@Param("userId") Long userId, @Param("offset") int offset, @Param("limit") int limit);

    // DEBUG: [AI-AUTHOR-2026-06-09] 오답 달력 - 날짜별 오답 개수 조회
    List<Map<String, Object>> selectWrongAnswerCountByDateRange(
            @Param("userId") Long userId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);
}
