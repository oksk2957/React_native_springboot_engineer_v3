package com.example.informationexam.dto.statistics;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ObjectiveCategoryStatRow {
    private String category;
    private long total;
    private long correct;
}
