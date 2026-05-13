package com.example.informationexam.dto.theory;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.apache.ibatis.type.Alias;

import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Alias("TheoryCardDto")
public class TheoryCardDto {
    private Long id;
    private Long subjectId;
    private String cardType;       // "SUBJECTIVE" or "FLASHCARD"
    private String frontText;
    private String backText;
    private String explanation;
    private Integer difficulty;    // null 허용 (플래시카드는 0)

    // 기존 fromMap 메서드는 그대로 유지 (호환성)
    public static TheoryCardDto fromMap(Map<String, Object> map) {
        TheoryCardDto dto = new TheoryCardDto();
        dto.id = ((Number) map.get("id")).longValue();
        dto.subjectId = map.get("subject_id") != null ? ((Number) map.get("subject_id")).longValue() : null;
        dto.cardType = (String) map.get("card_type");
        dto.frontText = (String) map.get("front_text");
        dto.backText = (String) map.get("back_text");
        dto.explanation = (String) map.get("explanation");
        dto.difficulty = map.get("difficulty") != null ? ((Number) map.get("difficulty")).intValue() : null;
        return dto;
    }
}
