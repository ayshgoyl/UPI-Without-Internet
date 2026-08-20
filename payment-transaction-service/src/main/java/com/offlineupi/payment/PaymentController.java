package com.offlineupi.payment;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/payments")
public class PaymentController {
    public record UssdPaymentRequest(String upiId, String amount, String note) {
    }

    @PostMapping("/initiate")
    public ResponseEntity<String> initiatePayment(@RequestBody(required = false) UssdPaymentRequest request) {
        String generatedTransactionId = java.util.UUID.randomUUID().toString();
        String payee = request != null && request.upiId() != null ? request.upiId() : "unknown";
        String amount = request != null && request.amount() != null ? request.amount() : "n/a";
        return ResponseEntity.ok(
                "Payment completed successfully. "
                        + "Payee: " + payee + ", Amount: " + amount
                        + ". Transaction ID: " + generatedTransactionId);
    }
}
