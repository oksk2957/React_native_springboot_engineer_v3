package com.example.informationexam.domain.statistics;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface StatisticsRepository {
    List<Statistics> findByUserIdOrderBySubmittedAtDesc(@Param("userId") Long userId);

    long countByUserIdAndProblemType(@Param("userId") Long userId, @Param("problemType") String problemType);

    long countByUserIdAndProblemTypeAndIsCorrectTrue(@Param("userId") Long userId, @Param("problemType") String problemType);

    // XML Mapper로 이관됨 (StatisticsRepositoryMapper.xml)
    long countDistinctReferenceIdsByUserIdAndProblemType(@Param("userId") Long userId, @Param("problemType") String problemType);
}