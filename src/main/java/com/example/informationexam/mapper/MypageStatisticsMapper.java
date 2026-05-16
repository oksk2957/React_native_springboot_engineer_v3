package com.example.informationexam.mapper;

import com.example.informationexam.dto.statistics.ContentTotalsRow;
import com.example.informationexam.dto.statistics.HeatmapDayRow;
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

    Map<String, Object> selectUserAnswerOverall(@Param("userId") long userId);

    List<MypageBranchStatRow> selectBranchStats(@Param("userId") long userId);

    List<ObjectiveCategoryStatRow> selectObjectiveCategoryStats(@Param("userId") long userId);

    ContentTotalsRow selectContentTotals();

    List<WrongAnswerListRow> selectWrongAnswers(@Param("userId") long userId);

    Map<String, Object> selectUserStatisticsFromFunction(@Param("userId") long userId);

    List<HeatmapDayRow> selectDailyAnswerCountsSince(
            @Param("userId") long userId,
            @Param("since") LocalDate since);

    List<WrongAnswerListRow> selectWrongAnswersByDate(
            @Param("userId") long userId,
            @Param("date") LocalDate date);
}
