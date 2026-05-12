package com.informationexam.dao;

import com.informationexam.model.Users;
import java.util.List;

public interface UsersDAO {
    List<Users> findAll();
    Users findById(Long id);
    Users findByEmail(String email);
    void insert(Users users);
    void update(Users users);
    void delete(Long id);
}
