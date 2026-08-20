package com.offlineupi.payment;

import com.offlineupi.payment.entity.PaymentDetail;
import com.offlineupi.payment.entity.PaymentTransaction;
import com.offlineupi.payment.repository.PaymentDetailRepository;
import com.offlineupi.payment.repository.PaymentTransactionRepository;
import java.time.Instant;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/payments")
public class PaymentController {
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final PaymentDetailRepository paymentDetailRepository;

    public PaymentController(PaymentTransactionRepository paymentTransactionRepository, PaymentDetailRepository paymentDetailRepository) {
        this.paymentTransactionRepository = paymentTransactionRepository;
        this.paymentDetailRepository = paymentDetailRepository;
    }

    public record UssdPaymentRequest(String upiId, String amount, String note) {
    }

    @PostMapping("/initiate")
    public ResponseEntity<String> initiatePayment(@RequestBody(required = false) UssdPaymentRequest request) {
        String generatedTransactionId = java.util.UUID.randomUUID().toString();
        String payee = request != null && request.upiId() != null ? request.upiId() : "unknown";
        String amount = request != null && request.amount() != null ? request.amount() : "n/a";
        String note = request != null && request.note() != null ? request.note() : "";
        paymentTransactionRepository.save(
                new PaymentTransaction(generatedTransactionId, payee, amount, note, "SUCCESS", Instant.now()));
        paymentDetailRepository.save(
                new PaymentDetail(generatedTransactionId, payee, amount, note, "SUCCESS", Instant.now()));
        return ResponseEntity.ok(
                "Payment completed successfully. "
                        + "Payee: " + payee + ", Amount: " + amount
                        + ". Transaction ID: " + generatedTransactionId);
    }
}
