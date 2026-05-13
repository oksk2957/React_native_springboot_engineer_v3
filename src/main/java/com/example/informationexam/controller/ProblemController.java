package com.example.informationexam.controller;

import com.example.informationexam.domain.problem.ProblemType;
import com.example.informationexam.dto.problem.ProblemResponseDto;
import com.example.informationexam.mapper.ProblemQueryMapper;
import com.example.informationexam.service.ProblemService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;
import java.util.Map;

@Controller
@RequestMapping("/problems")
@RequiredArgsConstructor
public class ProblemController {

    private final ProblemQueryMapper problemQueryMapper;
    private final ProblemService problemService;

    @GetMapping("/{id}")
    public String getProblem(@PathVariable Long id, Model model) {
        Map<String, Object> map = problemQueryMapper.selectById(id);
        if (map == null || map.isEmpty()) {
            throw new IllegalArgumentException("해당 문제가 존재하지 않습니다. id=" + id);
        }
        ProblemResponseDto problem = ProblemResponseDto.from(map);
        model.addAttribute("problem", problem);
        return "problem";
    }

    @GetMapping
    public String listProblems(@RequestParam(value = "type", required = false) ProblemType type,
                              @RequestParam(value = "limit", defaultValue = "10") int limit,
                              Model model) {
        String typeStr = (type != null) ? type.name() : ProblemType.OBJECTIVE.name();
        List<Map<String, Object>> maps = problemQueryMapper.selectRandomProblemsByType(typeStr, limit);
        List<ProblemResponseDto> problems = ProblemResponseDto.fromList(maps);
        
        model.addAttribute("problems", problems);
        return "problems";
    }

    /**
     * 객관식 랜덤학습 탭: 과목별 문제 + 옵션 1~5
     */
    @GetMapping("/study/objective")
    public String randomObjectiveStudy(@RequestParam(value = "limit", defaultValue = "10") int limit,
                                     Model model) {
        List<ProblemResponseDto> problems = problemService.getRandomObjectiveStudy(limit);
        List<Map<String, Object>> subjects = problemService.getProblemCountsBySubject();
        
        model.addAttribute("problems", problems);
        model.addAttribute("subjects", subjects);
        model.addAttribute("totalProblems", problemService.getProblemCount());
        return "study-objective";
    }
}
