package com.offlineupi.qr.repository;

import com.offlineupi.qr.entity.QrPaymentRecord;
import org.springframework.data.jpa.repository.JpaRepository;

public interface QrPaymentRecordRepository extends JpaRepository<QrPaymentRecord, String> {
}
