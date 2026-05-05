package com.example.informationexam.dto.problem;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProblemResponseDto {
    private Long id;
    private String question;
    @JsonProperty("correctAnswer")
    private String answer;
    private String explanation;
    private String category;
    private String type;
    private Integer difficulty;
    @JsonProperty("isAiGenerated")
    private Boolean isAiGenerated;
    private Map<String, String> options;
    private String programmingLanguage;

    // ★ Map 기반 매핑용 정적 팩토리 메서드 (비즈니스 로직 없음, 순수 데이터 변환)
    public static ProblemResponseDto from(Map<String, Object> map) {
        if (map == null || map.isEmpty()) return null;
        
        ProblemResponseDto dto = new ProblemResponseDto();
        dto.setId((Long) map.get("id"));
        dto.setQuestion((String) map.get("question"));
        dto.setAnswer((String) map.get("correct_answer")); // SQL 컬럼 alias와 매핑
        dto.setExplanation((String) map.get("explanation"));
        dto.setCategory((String) map.get("category"));
        dto.setType((String) map.get("type"));
        dto.setDifficulty((Integer) map.get("difficulty"));
        dto.setIsAiGenerated((Boolean) map.get("is_ai_generated"));
        
        // 옵션 Map 생성 (데이터 포맷팅만 수행, 비즈니스 로직 아님)
        Map<String, String> options = new LinkedHashMap<>();
        if ("OBJECTIVE".equals(dto.getType())) {
            if (map.get("option1") != null) options.put("1", (String) map.get("option1"));
            if (map.get("option2") != null) options.put("2", (String) map.get("option2"));
            if (map.get("option3") != null) options.put("3", (String) map.get("option3"));
            if (map.get("option4") != null) options.put("4", (String) map.get("option4"));
            if (map.get("option5") != null) options.put("5", (String) map.get("option5"));
        }
        dto.setOptions(options);
        dto.setProgrammingLanguage(map.get("programming_language") != null ? (String) map.get("programming_language") : null);
        
        return dto;
    }

    // ★ 리스트 변환 유틸리티
    public static List<ProblemResponseDto> fromList(List<Map<String, Object>> maps) {
        return maps == null ? List.of() : maps.stream()
                .map(ProblemResponseDto::from)
                .collect(Collectors.toList());
    }
}