package com.example.informationexam.service;

import com.example.informationexam.controller.dto.AnswerRequest;
import com.example.informationexam.domain.problem.Problem;
import com.example.informationexam.domain.problem.ProblemRepository;
import com.example.informationexam.domain.user.User;
import com.example.informationexam.domain.user.UserRepository;
import com.example.informationexam.domain.useranswer.StudySession;
import com.example.informationexam.domain.useranswer.StudySessionItem;
import com.example.informationexam.domain.useranswer.StudySessionItemRepository;
import com.example.informationexam.domain.useranswer.StudySessionRepository;
import com.example.informationexam.domain.useranswer.UserAnswer;
import com.example.informationexam.domain.useranswer.UserAnswerRepository;
import com.example.informationexam.domain.useranswer.WrongAnswerBookmark;
import com.example.informationexam.domain.useranswer.WrongAnswerBookmarkRepository;
import com.example.informationexam.domain.statistics.UserStatistics;
import com.example.informationexam.domain.statistics.UserStatisticsRepository;
import com.example.informationexam.mapper.ProblemQueryMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.UUID;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AnswerService {
    // DEBUG: [2026-05-26] @RequiredArgsConstructor를 사용하므로 명시적 필드 선언 필요
    private final ProblemRepository problemRepository;
    private final UserRepository userRepository;
    private final UserAnswerRepository userAnswerRepository;
    private final WrongAnswerBookmarkRepository wrongAnswerBookmarkRepository;
    private final UserStatisticsRepository userStatisticsRepository;
    private final ProblemQueryMapper problemQueryMapper;
    // DEBUG: [2026-06-07] study_session/study_session_item 저장 추가
    // 원인: 문제 풀이 시 user_answer만 저장되어 통계 랭킹 쿼리가 빈 결과를 반환
    // 해결: submitAnswer에서 StudySessionItem도 함께 저장
    private final StudySessionRepository studySessionRepository;
    private final StudySessionItemRepository studySessionItemRepository;

    @Transactional
    public Map<String, Object> submitAnswer(AnswerRequest request, String username) {
        String problemType = normalizeProblemType(request.getProblemType());
        Long problemId = request.getProblemId();
        String submittedAnswer = request.getSubmittedAnswer();

        log.info("[AnswerService] 답안 제출 시작 - problemId: {}, problemType: {}, username: {}, submittedAnswer: {}", problemId, problemType, username, submittedAnswer);
        log.debug("[AnswerService] 요청 원문 확인 - requestProblemType: {}, requestProblemId: {}, requestSubmittedAnswerLength: {}", request.getProblemType(), request.getProblemId(), submittedAnswer != null ? submittedAnswer.length() : 0);
        
        // 세션 개념 제거로 인해 sessionId 검증은 더 이상 수행하지 않음
        
        // 문제 유형별 처리
        Map<String, String> problemInfo = getProblemInfo(problemType, problemId);
        
        if (problemInfo == null || problemInfo.isEmpty()) {
            log.error("[AnswerService] 문제 조회 실패 - problemId: {}, problemType: {}", problemId, problemType);
            throw new IllegalArgumentException("해당 문제가 존재하지 않습니다. id=" + problemId + ", type=" + problemType);
        }
        
        log.info("[AnswerService] 문제 조회 성공 - problemId: {}", problemId);
        
        String correctAnswer = problemInfo.get("answer");
        String explanation = problemInfo.get("explanation");
        String question = problemInfo.get("question");
        
        // 정답 판정
        boolean isCorrect = correctAnswer.trim().equalsIgnoreCase(submittedAnswer.trim());
        log.info("[AnswerService] 정답 판정 완료 - problemId: {}, isCorrect: {}", problemId, isCorrect);

        // DEBUG: [2026-06-08] username null 체크 로그
        if (username == null || username.isEmpty()) {
            log.warn("[AnswerService] username이 null 또는 비어있음 - DB 저장 생략 (로그인 필요)");
            log.warn("[AnswerService] 현재 응답은 정답 판정만 반환: isCorrect={}, question={}", isCorrect, question);
            Map<String, Object> resultWithoutUser = new HashMap<>();
            resultWithoutUser.put("isCorrect", isCorrect);
            resultWithoutUser.put("correctAnswer", correctAnswer);
            resultWithoutUser.put("explanation", explanation);
            resultWithoutUser.put("question", question);
            return resultWithoutUser;
        }

        // 사용자가 명시된 경우 DB에 저장
        // DEBUG: [2026-06-09] 미완료12 수정 - 중복 null 체크 제거
        // 원인: 라인 76에서 username null이면 이미 return됨 → 여기선 항상 null이 아님
        // 해결: 불필요한 if (username != null) 제거로 코드 가독성 향상
        Optional<User> userOptional = userRepository.findByUsername(username);
        if (userOptional.isEmpty()) {
            userOptional = userRepository.findByEmail(username);
        }

        if (userOptional.isPresent()) {
            User user = userOptional.get();
            log.info("[AnswerService] 사용자 저장 처리 시작 - userId: {}, problemId: {}, problemType: {}, isCorrect: {}", user.getId(), problemId, problemType, isCorrect);

            try {
                // DEBUG: [2026-06-07] sessionId 자동 생성
                // 원인: sessionId가 null이면 @PrePersist에서 IllegalStateException 발생
                // 해결: UUID로 자동 생성하여 저장
                UserAnswer userAnswer = UserAnswer.builder()
                        .userId(user.getId())
                        .sessionId(UUID.randomUUID().toString())
                        .itemType(problemType)
                        .referenceId(problemId)
                        .submittedAnswer(submittedAnswer)
                        .isCorrect(isCorrect)
                        .build();
                userAnswerRepository.save(userAnswer);
                log.info("[AnswerService] UserAnswer 저장 성공 - userId: {}, problemId: {}, problemType: {}", user.getId(), problemId, problemType);

                // DEBUG: [2026-06-07] StudySessionItem 저장 추가
                // 원인: 통계 랭킹 쿼리(selectSubjectRanking)가 study_session_item 기반으로
                //       작성되어 있으나, submitAnswer에서는 user_answer만 저장하여
                //       통계/랭킹 데이터가 비어 있음
                // 해결: StudySession을 find-or-create 하고 StudySessionItem을 저장
                try {
                    StudySession session = studySessionRepository.findByUserId(user.getId())
                            .orElseGet(() -> {
                                String sessionKey = "sess-" + user.getId() + "-" + System.currentTimeMillis();
                                log.info("[AnswerService] 새 StudySession 생성 - userId: {}, sessionKey: {}", user.getId(), sessionKey);
                                StudySession newSession = new StudySession(sessionKey, user.getEmail(), user.getId());
                                return studySessionRepository.save(newSession);
                            });
                    session.touch();
                    studySessionRepository.save(session);

                    Long subjectId = resolveSubjectId(problemType, problemId);
                    StudySessionItem sessionItem = StudySessionItem.builder()
                            .sessionId(session.getId())
                            .itemType(problemType)
                            .referenceId(problemId)
                            .subjectId(subjectId != null ? subjectId : 0L)
                            .itemOrder(0)
                            .isAnswered(true)
                            .isCorrect(isCorrect)
                            .userSubmittedAnswer(submittedAnswer)
                            .bookmarkedWrong(!isCorrect)
                            .build();
                    studySessionItemRepository.save(sessionItem);
                    log.info("[AnswerService] StudySessionItem 저장 성공 - sessionId: {}, userId: {}, problemId: {}, problemType: {}", session.getId(), user.getId(), problemId, problemType);
                } catch (Exception ex) {
                    log.error("[AnswerService] StudySessionItem 저장 실패 (비치명적) - userId: {}, problemId: {}, 오류: {}", user.getId(), problemId, ex.getMessage(), ex);
                    // StudySessionItem 저장 실패는 user_answer 저장을 막지 않음
                }
            } catch (Exception e) {
                log.error("[AnswerService] UserAnswer 저장 실패 - userId: {}, problemId: {}, problemType: {}, submittedAnswer: {}, 오류: {}", user.getId(), problemId, problemType, submittedAnswer, e.getMessage(), e);
                throw new RuntimeException("답안 저장 중 오류가 발생했습니다.", e);
            }

            if (!isCorrect) {
                log.info("[AnswerService] WrongAnswerBookmark 저장 시도 - userId: {}, problemId: {}, problemType: {}", user.getId(), problemId, problemType);
                try {
                    log.debug("[AnswerService] WrongAnswerBookmark insert 준비 - userId: {}, problemId: {}, problemType: {}", user.getId(), problemId, problemType);
                    upsertWrongAnswerBookmarkIfAbsent(user.getId(), problemType, problemId);
                    log.info("[AnswerService] WrongAnswerBookmark 저장 성공 - userId: {}, problemId: {}", user.getId(), problemId);
                } catch (Exception e) {
                    log.error("[AnswerService] WrongAnswerBookmark 저장 실패 - userId: {}, problemId: {}, problemType: {}, 오류: {}", user.getId(), problemId, problemType, e.getMessage(), e);
                    throw new RuntimeException("오답 북마크 저장 중 오류가 발생했습니다.", e);
                }
            }

            log.info("[AnswerService] UserStatistics 저장 시도 - userId: {}, problemId: {}, problemType: {}, isCorrect: {}", user.getId(), problemId, problemType, isCorrect);
            try {
                upsertUserStatistics(user.getId(), problemType, problemId, isCorrect);
                log.info("[AnswerService] UserStatistics 저장 성공 - userId: {}, problemId: {}, problemType: {}", user.getId(), problemId, problemType);
            } catch (Exception e) {
                log.error("[AnswerService] UserStatistics 저장 실패 - userId: {}, problemId: {}, problemType: {}, 오류: {}", user.getId(), problemId, problemType, e.getMessage(), e);
                throw new RuntimeException("통계 저장 중 오류가 발생했습니다.", e);
            }
        } else {
            log.warn("[AnswerService] 사용자 식별 실패로 저장 생략 - username: {}", username);
        }
        
        log.info("[AnswerService] 답안 제출 완료 - problemId: {}, isCorrect: {}", problemId, isCorrect);
        
        // Map 기반 응답 생성
        Map<String, Object> response = new HashMap<>();
        response.put("isCorrect", isCorrect);
        response.put("explanation", explanation);
        response.put("correctAnswer", correctAnswer);
        response.put("question", question);
        
        return response;
    }

    /**
     * 문제 유형과 ID로 문제를 조회하여 정답, 해설, 문제를 반환
     */
    private Map<String, String> getProblemInfo(String problemType, Long problemId) {
        Map<String, String> info = new HashMap<>();
        
        switch (problemType) {
            case "OBJECTIVE":
                Optional<Problem> problemOpt = problemRepository.findById(problemId);
                if (problemOpt.isPresent()) {
                    Problem problem = problemOpt.get();
                    info.put("answer", problem.getAnswer());
                    info.put("explanation", problem.getExplanation());
                    info.put("question", problem.getQuestion());
                }
                break;
                
            case "SUBJECTIVE":
            case "PROGRAMMING_LANGUAGE":
                // MyBatis mapper 사용
                Map<String, Object> map = problemQueryMapper.selectById(problemId);
                if (map != null && !map.isEmpty()) {
                    info.put("answer", (String) map.get("correct_answer"));
                    info.put("explanation", (String) map.get("explanation"));
                    info.put("question", (String) map.get("question"));
                }
                break;
        }
        
        return info;
    }

    private String normalizeProblemType(String rawType) {
        if (rawType == null || rawType.isBlank()) {
            return "OBJECTIVE";
        }
        String upper = rawType.trim().toUpperCase();
        if ("MULTIPLE_CHOICE".equals(upper)) {
            return "OBJECTIVE";
        }
        return upper;
    }

    private void upsertUserStatistics(Long userId, String problemType, Long problemId, boolean isCorrect) {
        Long subjectId = resolveSubjectId(problemType, problemId);
        if (subjectId == null) {
            return;
        }

        UserStatistics stat = userStatisticsRepository
                .findByUserIdAndSubjectIdAndBranch(userId, subjectId, problemType)
                .orElseGet(() -> UserStatistics.builder()
                        .userId(userId)
                        .subjectId(subjectId)
                        .branch(problemType)
                        .build());

        stat.recordAttempt(isCorrect);
        userStatisticsRepository.save(stat);
    }

    private Long resolveSubjectId(String problemType, Long problemId) {
        if ("OBJECTIVE".equals(problemType)) {
            // DEBUG: [2026-05-26] Subject.id가 Integer이므로 longValue()로 변환
            return problemRepository.findById(problemId)
                    .map(Problem::getSubject)
                    .map(subject -> subject != null ? subject.getId().longValue() : null)
                    .orElse(null);
        }

        Map<String, Object> map = problemQueryMapper.selectById(problemId);
        if (map == null) {
            return null;
        }
        Object subjectId = map.get("subject_id");
        if (subjectId instanceof Number) {
            return ((Number) subjectId).longValue();
        }
        return null;
    }

    private void upsertWrongAnswerBookmarkIfAbsent(Long userId, String problemType, Long problemId) {
        boolean exists = wrongAnswerBookmarkRepository
                .existsByUserIdAndItemTypeAndReferenceId(userId, problemType, problemId);
        if (exists) {
            return;
        }

        WrongAnswerBookmark bookmark = WrongAnswerBookmark.builder()
                .userId(userId)
                .itemType(problemType)
                .referenceId(problemId)
                .build();
        wrongAnswerBookmarkRepository.save(bookmark);
    }
}
