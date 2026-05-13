package com.example.informationexam.controller;

import com.example.informationexam.domain.user.User;
import com.example.informationexam.service.SupabaseTokenVerifierService;
import com.example.informationexam.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class UserController {
    private final UserService userService;
    private final SupabaseTokenVerifierService supabaseTokenVerifierService;

    @PostMapping("/users/nickname")
    public ResponseEntity<User> setNickname(@RequestBody Map<String, String> request,
            @RequestHeader("Authorization") String authHeader) {
        String token = supabaseTokenVerifierService.extractBearerToken(authHeader);
        String email = supabaseTokenVerifierService.getEmail(token);
        String username = userService.getUserByEmail(email).getUsername();

        User updatedUser = userService.setNickname(username, request.get("nickname"));

        System.out.println("Nickname set for user: " + username + " to " + request.get("nickname"));

        return ResponseEntity.ok(updatedUser);
    }
}
