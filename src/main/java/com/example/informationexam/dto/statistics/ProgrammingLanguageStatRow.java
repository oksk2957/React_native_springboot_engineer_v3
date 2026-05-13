package com.example.informationexam.dto.statistics;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProgrammingLanguageStatRow {
    private String language;
    private long attempted;
    private long correct;
}
