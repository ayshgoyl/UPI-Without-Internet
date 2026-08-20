package com.offlineupi.payment;

import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/payments")
public class PaymentController {
    private final com.offlineupi.payment.service.PaymentProducerService paymentProducerService;

    public PaymentController(com.offlineupi.payment.service.PaymentProducerService paymentProducerService) {
        this.paymentProducerService = paymentProducerService;
    }

    public record UssdPaymentRequest(String upiId, String amount, String note) {
    }

    @PostMapping("/initiate")
    @CircuitBreaker(name = "bankingServer", fallbackMethod = "fallbackOfflinePayment")
    public ResponseEntity<String> initiatePayment(@RequestBody(required = false) UssdPaymentRequest request) {
        String generatedTransactionId = java.util.UUID.randomUUID().toString();
        String payee = request != null && request.upiId() != null ? request.upiId() : "unknown";
        String amount = request != null && request.amount() != null ? request.amount() : "n/a";
        return ResponseEntity.ok(
                "Payment completed successfully. "
                        + "Payee: " + payee + ", Amount: " + amount
                        + ". Transaction ID: " + generatedTransactionId);
    }

    public ResponseEntity<String> fallbackOfflinePayment(UssdPaymentRequest request, Exception e) {
        // Graceful Degradation: Accept the payment in offline mode and queue it
        String generatedTransactionId = java.util.UUID.randomUUID().toString();
        paymentProducerService.sendOfflinePaymentEvent(generatedTransactionId);
        String payee = request != null && request.upiId() != null ? request.upiId() : "unknown";
        String amount = request != null && request.amount() != null ? request.amount() : "n/a";
        return ResponseEntity.ok(
                "External server unreachable. Payment securely queued for offline processing. "
                        + "Payee: " + payee + ", Amount: " + amount
                        + ". Transaction ID: " + generatedTransactionId);
    }
}
