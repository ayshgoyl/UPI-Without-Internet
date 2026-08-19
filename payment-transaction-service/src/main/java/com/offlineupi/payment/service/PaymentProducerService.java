package com.offlineupi.payment.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
public class PaymentProducerService {

    private static final Logger logger = LoggerFactory.getLogger(PaymentProducerService.class);
    private final KafkaTemplate<String, String> kafkaTemplate;

    public PaymentProducerService(KafkaTemplate<String, String> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    public void sendOfflinePaymentEvent(String transactionId) {
        logger.info("Publishing offline payment event for Transaction ID: {}", transactionId);
        kafkaTemplate.send("offline-payments-topic", transactionId);
    }
}
