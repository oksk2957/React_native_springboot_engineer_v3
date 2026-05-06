package com.example.informationexam.mapper;

import com.example.informationexam.dto.problem.ProblemResponseDto;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component
public class ProblemResponseAssembler {
    
    public ProblemResponseDto toDto(Map<String, Object> map) {
        return ProblemResponseDto.from(map);
    }
    
    public List<ProblemResponseDto> toDtoList(List<Map<String, Object>> maps) {
        return ProblemResponseDto.fromList(maps);
    }
}