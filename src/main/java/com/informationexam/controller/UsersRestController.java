package com.informationexam.controller;

import com.informationexam.model.Users;
import com.informationexam.service.UsersService;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UsersRestController {
    private final UsersService usersService;

    public UsersRestController(UsersService usersService) {
        this.usersService = usersService;
    }

    @GetMapping
    public List<Users> getAllUsers() {
        return usersService.getAllUsers();
    }

    @GetMapping("/{id}")
    public Users getUser(@PathVariable Long id) {
        return usersService.getUserById(id);
    }

    @GetMapping("/email/{email}")
    public Users getUserByEmail(@PathVariable String email) {
        return usersService.getUserByEmail(email);
    }

    @PostMapping
    public void createUser(@RequestBody Users user) {
        usersService.createUser(user);
    }

    @PutMapping("/{id}")
    public void updateUser(@PathVariable Long id, @RequestBody Users user) {
        user.setId(id);
        usersService.updateUser(user);
    }

    @DeleteMapping("/{id}")
    public void deleteUser(@PathVariable Long id) {
        usersService.deleteUser(id);
    }
}
