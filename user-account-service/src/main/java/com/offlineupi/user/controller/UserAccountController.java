package com.offlineupi.user.controller;

import com.offlineupi.user.entity.UserAccount;
import com.offlineupi.user.repository.UserAccountRepository;
import java.time.Instant;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/users")
public class UserAccountController {

    private static final Logger log = LoggerFactory.getLogger(UserAccountController.class);

    private static final String DEFAULT_MOBILE = "9876543210";
    private static final String DEFAULT_UPI_ID = "9876543210@upi";

    private final UserAccountRepository userAccountRepository;

    public UserAccountController(UserAccountRepository userAccountRepository) {
        this.userAccountRepository = userAccountRepository;
    }

    @GetMapping("/profile")
    public UserAccount profile() {
        log.info("User profile request received: mobile={}", DEFAULT_MOBILE);

        try {
            UserAccount account = userAccountRepository.findById(DEFAULT_MOBILE)
                    .orElseGet(() -> {
                        log.info("User account not found; creating default profile: mobile={}, upiId={}",
                                DEFAULT_MOBILE, DEFAULT_UPI_ID);
                        return new UserAccount(DEFAULT_MOBILE, DEFAULT_UPI_ID, "CUSTOMER", "EN", Instant.now());
                    });
            account.setLastAccessedAt(Instant.now());
            UserAccount savedAccount = userAccountRepository.save(account);
            log.info("User profile saved successfully: mobile={}, upiId={}",
                    savedAccount.getMobileNumber(), savedAccount.getUpiId());
            return savedAccount;
        } catch (Exception e) {
            log.error("Failed to load or save user profile: mobile={}, error={}",
                    DEFAULT_MOBILE, e.getMessage(), e);
            throw e;
        }
    }
}
