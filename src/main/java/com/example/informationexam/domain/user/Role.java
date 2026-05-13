package com.example.informationexam.domain.user;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum Role {
    FREE_USER("free_user", "무료 사용자"),
    MONEY_USER("money_user", "유료 사용자"),
    ADMIN("admin", "관리자");

    private final String key;
    private final String title;
}
