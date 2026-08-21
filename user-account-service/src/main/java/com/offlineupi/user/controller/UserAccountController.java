package com.offlineupi.user.controller;

import com.offlineupi.user.entity.UserAccount;
import com.offlineupi.user.repository.UserAccountRepository;
import java.time.Instant;
import java.util.UUID;
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
        String auditMobileNumber = DEFAULT_MOBILE + "-" + UUID.randomUUID();
        log.info("User profile action received: baseMobile={}, auditMobile={}", DEFAULT_MOBILE, auditMobileNumber);

        try {
            UserAccount account = new UserAccount(
                    auditMobileNumber,
                    DEFAULT_UPI_ID,
                    "CUSTOMER",
                    "EN",
                    Instant.now());
            UserAccount savedAccount = userAccountRepository.save(account);
            log.info("User profile action row saved successfully: mobile={}, upiId={}",
                    savedAccount.getMobileNumber(), savedAccount.getUpiId());
            return savedAccount;
        } catch (Exception e) {
            log.error("Failed to save user profile action row: baseMobile={}, auditMobile={}, error={}",
                    DEFAULT_MOBILE, auditMobileNumber, e.getMessage(), e);
            throw e;
        }
    }
}
