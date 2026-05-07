package com.informationexam.dto;

public class TheoryCardDto {
    private Long id;
    private Long subjectId;
    private String cardType;
    private String question;
    private String answer;
    private String explanation;
    private String frontText;
    private String backText;
    private String answerText;

    public TheoryCardDto() {}

    public TheoryCardDto(Long id, Long subjectId, String cardType, String question, 
                         String answer, String explanation, String frontText, 
                         String backText, String answerText) {
        this.id = id;
        this.subjectId = subjectId;
        this.cardType = cardType;
        this.question = question;
        this.answer = answer;
        this.explanation = explanation;
        this.frontText = frontText;
        this.backText = backText;
        this.answerText = answerText;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getSubjectId() { return subjectId; }
    public void setSubjectId(Long subjectId) { this.subjectId = subjectId; }
    public String getCardType() { return cardType; }
    public void setCardType(String cardType) { this.cardType = cardType; }
    public String getQuestion() { return question; }
    public void setQuestion(String question) { this.question = question; }
    public String getAnswer() { return answer; }
    public void setAnswer(String answer) { this.answer = answer; }
    public String getExplanation() { return explanation; }
    public void setExplanation(String explanation) { this.explanation = explanation; }
    public String getFrontText() { return frontText; }
    public void setFrontText(String frontText) { this.frontText = frontText; }
    public String getBackText() { return backText; }
    public void setBackText(String backText) { this.backText = backText; }
    public String getAnswerText() { return answerText; }
    public void setAnswerText(String answerText) { this.answerText = answerText; }
}