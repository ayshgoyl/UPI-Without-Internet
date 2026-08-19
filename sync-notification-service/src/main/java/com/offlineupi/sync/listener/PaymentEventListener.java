package com.offlineupi.sync.listener;

import com.offlineupi.sync.service.TransactionSyncService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
public class PaymentEventListener {

    private static final Logger logger = LoggerFactory.getLogger(PaymentEventListener.class);
    private final TransactionSyncService transactionSyncService;

    public PaymentEventListener(TransactionSyncService transactionSyncService) {
        this.transactionSyncService = transactionSyncService;
    }

    @KafkaListener(topics = "offline-payments-topic", groupId = "sync-group")
    public void handleOfflinePaymentEvent(String transactionId) {
        logger.info("Received Kafka event for offline transaction: {}", transactionId);
        try {
            transactionSyncService.syncOfflineTransaction(transactionId);
        } catch (Exception e) {
            logger.error("Failed to sync transaction {} after all retries.", transactionId);
        }
    }
}
