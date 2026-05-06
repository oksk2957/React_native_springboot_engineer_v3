package com.informationexam.service;

import com.informationexam.dao.UsersDAO;
import com.informationexam.model.Users;
import java.util.List;

public class UsersService {
    private UsersDAO usersDAO;

    public void setUsersDAO(UsersDAO usersDAO) {
        this.usersDAO = usersDAO;
    }

    public List<Users> getAllUsers() {
        return usersDAO.findAll();
    }

    public Users getUserById(Long id) {
        return usersDAO.findById(id);
    }

    public Users getUserByEmail(String email) {
        return usersDAO.findByEmail(email);
    }

    public void createUser(Users user) {
        usersDAO.insert(user);
    }

    public void updateUser(Users user) {
        usersDAO.update(user);
    }

    public void deleteUser(Long id) {
        usersDAO.delete(id);
    }
}
