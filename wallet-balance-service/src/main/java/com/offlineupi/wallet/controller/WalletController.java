package com.offlineupi.wallet.controller;

import com.offlineupi.wallet.entity.Wallet;
import com.offlineupi.wallet.repository.WalletRepository;
import jakarta.transaction.Transactional;
import java.math.BigDecimal;
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
        log.info("Wallet balance request received: upiId={}", upiId);

        try {
            Wallet wallet = walletRepository.findByIdWithLock(upiId)
                    .orElseGet(() -> {
                        log.info("Wallet not found; creating default wallet: upiId={}", upiId);
                        return walletRepository.save(new Wallet(upiId, BigDecimal.valueOf(12500.00)));
                    });
            log.info("Wallet balance loaded successfully: upiId={}, balance={}", upiId, wallet.getBalance());
            return wallet;
        } catch (Exception e) {
            log.error("Failed to load wallet balance: upiId={}, error={}", upiId, e.getMessage(), e);
            throw e;
        }
    }
}
