package com.offlineupi.payment;

import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/payments")
public class PaymentController {
    private final com.offlineupi.payment.service.PaymentProducerService paymentProducerService;

    public PaymentController(com.offlineupi.payment.service.PaymentProducerService paymentProducerService) {
        this.paymentProducerService = paymentProducerService;
    }

    @PostMapping("/initiate")
    @CircuitBreaker(name = "bankingServer", fallbackMethod = "fallbackOfflinePayment")
    public ResponseEntity<String> initiatePayment() {
        // Simulating a call to an external banking server that might fail if offline
        throw new RuntimeException("Simulated Network Disconnect");
    }

    public ResponseEntity<String> fallbackOfflinePayment(Exception e) {
        // Graceful Degradation: Accept the payment in offline mode and queue it
        String generatedTransactionId = java.util.UUID.randomUUID().toString();
        paymentProducerService.sendOfflinePaymentEvent(generatedTransactionId);
        return ResponseEntity.ok("External server unreachable. Payment securely queued for offline processing. Transaction ID: " + generatedTransactionId);
    }
}
