package com.offlineupi.qr.controller;

import com.offlineupi.qr.entity.QrPaymentRecord;
import com.offlineupi.qr.repository.QrPaymentRecordRepository;
import java.time.Instant;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/qr")
public class QrPaymentController {

    private static final Logger log = LoggerFactory.getLogger(QrPaymentController.class);

    private final QrPaymentRecordRepository qrPaymentRecordRepository;

    public QrPaymentController(QrPaymentRecordRepository qrPaymentRecordRepository) {
        this.qrPaymentRecordRepository = qrPaymentRecordRepository;
    }

    public record QrPaymentRequest(String referenceId, String actionType, String upiId, String amount) {
    }

    @PostMapping("/records")
    public QrPaymentRecord record(@RequestBody(required = false) QrPaymentRequest request) {
        log.info("QR payment record request received: referenceId={}, actionType={}, upiId={}, amount={}",
                request != null ? request.referenceId() : "null",
                request != null ? request.actionType() : "null",
                request != null ? request.upiId() : "null",
                request != null ? request.amount() : "null");

        String referenceId = request != null && request.referenceId() != null
                ? request.referenceId()
                : UUID.randomUUID().toString();
        String actionType = request != null && request.actionType() != null ? request.actionType() : "UNKNOWN";
        String upiId = request != null && request.upiId() != null ? request.upiId() : "unknown";
        String amount = request != null && request.amount() != null ? request.amount() : "n/a";

        try {
            QrPaymentRecord savedRecord = qrPaymentRecordRepository.save(
                    new QrPaymentRecord(referenceId, actionType, upiId, amount, Instant.now()));
            log.info("QR payment record saved successfully: referenceId={}, actionType={}, upiId={}",
                    referenceId, actionType, upiId);
            return savedRecord;
        } catch (Exception e) {
            log.error("Failed to save QR payment record: referenceId={}, actionType={}, upiId={}, amount={}, error={}",
                    referenceId, actionType, upiId, amount, e.getMessage(), e);
            throw e;
        }
    }
}
