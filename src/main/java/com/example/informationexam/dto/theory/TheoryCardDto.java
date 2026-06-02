package com.example.informationexam.dto.theory;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.apache.ibatis.type.Alias;

import java.util.Map;
import java.util.List;
import java.util.ArrayList;

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

    // DEBUG: [주관식 보기] 주관식 퀴즈를 5개 보기 중 선택하는 형태로 변경
    // 원인: 사용자가 TextInput 대신 5개 보기 버튼 형태로 변경 요청
    // 해결: options 필드 추가하여 프론트엔드에 보기 데이터 전달
    private List<String> options;  // 주관식 문제의 보기 목록 (최대 5개)

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

        // DEBUG: [주관식 보기] fromMap에서 options 파싱 로직 추가
        // 원인: DB에서 option1~5 컬럼을 List<String>으로 변환 필요
        // 해결: null이 아닌 옵션만 필터링하여 options 리스트 생성
        List<String> options = new ArrayList<>();
        for (int i = 1; i <= 5; i++) {
            String option = (String) map.get("option" + i);
            if (option != null && !option.trim().isEmpty()) {
                options.add(option);
            }
        }
        dto.options = options.isEmpty() ? null : options;

        return dto;
    }
}
