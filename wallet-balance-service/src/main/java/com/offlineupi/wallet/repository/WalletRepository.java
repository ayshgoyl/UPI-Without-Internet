package com.offlineupi.wallet.repository;

import com.offlineupi.wallet.entity.Wallet;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface WalletRepository extends JpaRepository<Wallet, String> {

    // Demonstrating the 'Locking' technology requirement
    // Pessimistic write lock ensures that no other transaction can read or update the wallet
    // balance until the current transaction commits, preventing double-spending.
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT w FROM Wallet w WHERE w.upiId = :upiId")
    Optional<Wallet> findByIdWithLock(@Param("upiId") String upiId);
}
