package com.offlineupi.gateway.repository;

import com.offlineupi.gateway.entity.GatewayRequestLog;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GatewayRequestLogRepository extends JpaRepository<GatewayRequestLog, Long> {
}
