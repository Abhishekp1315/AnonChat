package com.anonchat.repository;

import com.anonchat.model.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends MongoRepository<User, String> {
    Optional<User> findByEmail(String email);
    Optional<User> findByEmailAndPhoneNumber(String email, String phoneNumber);
    boolean existsByEmail(String email);
}
