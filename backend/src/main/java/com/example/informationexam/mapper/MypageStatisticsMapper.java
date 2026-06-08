package com.example.informationexam.mapper;

import com.example.informationexam.dto.statistics.ContentTotalsRow;
import com.example.informationexam.dto.statistics.MypageBranchStatRow;
import com.example.informationexam.dto.statistics.ObjectiveCategoryStatRow;
import com.example.informationexam.dto.statistics.WrongAnswerListRow;
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
}
