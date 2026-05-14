package com.example.informationexam.service;

import com.example.informationexam.domain.problem.Subject;
import com.example.informationexam.domain.problem.SubjectRepository;
import com.example.informationexam.dto.theory.TheoryCardDto;
import com.example.informationexam.mapper.TheoryMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TheoryService {

    private final TheoryMapper theoryMapper;
    private final SubjectRepository subjectRepository;

    /**
     * 이론 카드 조회 (카테고리 유효성 검증 포함)
     * @param categoryName 카테고리 이름 (subject.name과 대소문자 무시 비교)
     * @return 이론 카드 목록
     * @throws IllegalArgumentException 존재하지 않는 카테고리인 경우
     */
    public List<TheoryCardDto> findTheoryCardsByCategory(String categoryName) {
        // 카테고리가 제공된 경우 유효성 검증
        if (categoryName != null && !categoryName.trim().isEmpty()) {
            // 대소문자 무시하고 조회
            Subject subject = subjectRepository.findByNameIgnoreCase(categoryName)
                    .orElse(null);
            
            // 일치하는 과목이 없으면 에러 발생
            if (subject == null) {
                throw new IllegalArgumentException(
                    "존재하지 않는 카테고리입니다: " + categoryName
                );
            }
        }
        
        return theoryMapper.findTheoryCards(categoryName);
    }

}
