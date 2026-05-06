package com.informationexam.controller;

import com.informationexam.model.Users;
import com.informationexam.service.UsersService;
import java.util.List;

public class UsersController {
    private UsersService usersService;

    public void setUsersService(UsersService usersService) {
        this.usersService = usersService;
    }

    public List<Users> listUsers() {
        return usersService.getAllUsers();
    }

    public Users getUser(Long id) {
        return usersService.getUserById(id);
    }

    public Users getUserByEmail(String email) {
        return usersService.getUserByEmail(email);
    }

    public void addUser(Users user) {
        usersService.createUser(user);
    }

    public void editUser(Users user) {
        usersService.updateUser(user);
    }

    public void removeUser(Long id) {
        usersService.deleteUser(id);
    }
}
