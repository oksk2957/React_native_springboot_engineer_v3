package com.example.informationexam.mapper;

import com.example.informationexam.dto.theory.TheoryCardDto;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface TheoryMapper {

    List<TheoryCardDto> findTheoryCards(@Param("categoryName") String categoryName);

    List<TheoryCardDto> selectTheoryCardsByCategory(@Param("category") String category);

    TheoryCardDto findTheoryCardById(Long id);

}
