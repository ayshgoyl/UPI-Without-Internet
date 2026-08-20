package com.offlineupi.qr.controller;

import com.offlineupi.qr.entity.QrPaymentRecord;
import com.offlineupi.qr.repository.QrPaymentRecordRepository;
import java.time.Instant;
import java.util.UUID;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/qr")
public class QrPaymentController {

    private final QrPaymentRecordRepository qrPaymentRecordRepository;

    public QrPaymentController(QrPaymentRecordRepository qrPaymentRecordRepository) {
        this.qrPaymentRecordRepository = qrPaymentRecordRepository;
    }

    public record QrPaymentRequest(String referenceId, String actionType, String upiId, String amount) {
    }

    @PostMapping("/records")
    public QrPaymentRecord record(@RequestBody(required = false) QrPaymentRequest request) {
        String referenceId = request != null && request.referenceId() != null
                ? request.referenceId()
                : UUID.randomUUID().toString();
        String actionType = request != null && request.actionType() != null ? request.actionType() : "UNKNOWN";
        String upiId = request != null && request.upiId() != null ? request.upiId() : "unknown";
        String amount = request != null && request.amount() != null ? request.amount() : "n/a";
        return qrPaymentRecordRepository.save(new QrPaymentRecord(referenceId, actionType, upiId, amount, Instant.now()));
    }
}
