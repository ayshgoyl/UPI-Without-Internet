package com.offlineupi.qr.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "qr_payment_records")
public class QrPaymentRecord {

    @Id
    private String referenceId;

    private String actionType;
    private String upiId;
    private String amount;
    private Instant createdAt;

    public QrPaymentRecord() {
    }

    public QrPaymentRecord(String referenceId, String actionType, String upiId, String amount, Instant createdAt) {
        this.referenceId = referenceId;
        this.actionType = actionType;
        this.upiId = upiId;
        this.amount = amount;
        this.createdAt = createdAt;
    }

    public String getReferenceId() {
        return referenceId;
    }

    public void setReferenceId(String referenceId) {
        this.referenceId = referenceId;
    }

    public String getActionType() {
        return actionType;
    }

    public void setActionType(String actionType) {
        this.actionType = actionType;
    }

    public String getUpiId() {
        return upiId;
    }

    public void setUpiId(String upiId) {
        this.upiId = upiId;
    }

    public String getAmount() {
        return amount;
    }

    public void setAmount(String amount) {
        this.amount = amount;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
