package com.offlineupi.user.controller;

import com.offlineupi.user.entity.UserAccount;
import com.offlineupi.user.repository.UserAccountRepository;
import java.time.Instant;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/users")
public class UserAccountController {

    private static final String DEFAULT_MOBILE = "9876543210";
    private static final String DEFAULT_UPI_ID = "9876543210@upi";

    private final UserAccountRepository userAccountRepository;

    public UserAccountController(UserAccountRepository userAccountRepository) {
        this.userAccountRepository = userAccountRepository;
    }

    @GetMapping("/profile")
    public UserAccount profile() {
        UserAccount account = userAccountRepository.findById(DEFAULT_MOBILE)
                .orElseGet(() -> new UserAccount(DEFAULT_MOBILE, DEFAULT_UPI_ID, "CUSTOMER", "EN", Instant.now()));
        account.setLastAccessedAt(Instant.now());
        return userAccountRepository.save(account);
    }
}
