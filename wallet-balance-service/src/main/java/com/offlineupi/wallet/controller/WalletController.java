package com.offlineupi.wallet.controller;

import com.offlineupi.wallet.entity.Wallet;
import com.offlineupi.wallet.repository.WalletRepository;
import jakarta.transaction.Transactional;
import java.math.BigDecimal;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/wallets")
public class WalletController {

    private static final Logger log = LoggerFactory.getLogger(WalletController.class);

    private final WalletRepository walletRepository;

    public WalletController(WalletRepository walletRepository) {
        this.walletRepository = walletRepository;
    }

    @GetMapping("/{upiId}")
    @Transactional
    public Wallet balance(@PathVariable String upiId) {
        String auditUpiId = upiId + "-" + UUID.randomUUID();
        log.info("Wallet balance action received: requestedUpiId={}, auditUpiId={}", upiId, auditUpiId);

        try {
            Wallet wallet = walletRepository.save(new Wallet(auditUpiId, BigDecimal.valueOf(12500.00)));
            log.info("Wallet balance action row saved successfully: requestedUpiId={}, auditUpiId={}, balance={}",
                    upiId, auditUpiId, wallet.getBalance());
            return wallet;
        } catch (Exception e) {
            log.error("Failed to save wallet balance action row: requestedUpiId={}, auditUpiId={}, error={}",
                    upiId, auditUpiId, e.getMessage(), e);
            throw e;
        }
    }
}
