package com.offlineupi.wallet.controller;

import com.offlineupi.wallet.entity.Wallet;
import com.offlineupi.wallet.repository.WalletRepository;
import jakarta.transaction.Transactional;
import java.math.BigDecimal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/wallets")
public class WalletController {

    private final WalletRepository walletRepository;

    public WalletController(WalletRepository walletRepository) {
        this.walletRepository = walletRepository;
    }

    @GetMapping("/{upiId}")
    @Transactional
    public Wallet balance(@PathVariable String upiId) {
        return walletRepository.findByIdWithLock(upiId)
                .orElseGet(() -> walletRepository.save(new Wallet(upiId, BigDecimal.valueOf(12500.00))));
    }
}
