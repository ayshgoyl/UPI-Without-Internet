package com.offlineupi.sync.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Retryable;
import org.springframework.stereotype.Service;

@Service
public class TransactionSyncService {

    private static final Logger logger = LoggerFactory.getLogger(TransactionSyncService.class);

    // Demonstrates Exponential Backoff:
    // Retries up to 4 times. 
    // Wait times: 2s, 4s, 8s, up to max 16s.
    @Retryable(
            retryFor = { RuntimeException.class },
            maxAttempts = 4,
            backoff = @Backoff(delay = 2000, multiplier = 2.0, maxDelay = 16000)
    )
    public void syncOfflineTransaction(String transactionId) {
        logger.info("Attempting to sync transaction: {}", transactionId);
        
        // Simulating a network failure that requires retrying
        boolean networkAvailable = false;
        
        if (!networkAvailable) {
            logger.error("Network unavailable, sync failed for transaction: {}", transactionId);
            throw new RuntimeException("External banking server unreachable");
        }
        
        logger.info("Transaction {} synced successfully", transactionId);
    }
}
