package com.example.informationexam.dto.statistics;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ContentTotalsRow {
    private long objectiveCount;
    private long subjectiveCount;
    private long programmingCount;
}
