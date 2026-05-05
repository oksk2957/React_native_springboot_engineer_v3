package com.example.informationexam.dto.problem;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

/** 이론 학습 목록 요약(API: total + ordered ids) */
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class TheoryProblemMetaDto {
    private long total;
    private List<Long> ids;
}
