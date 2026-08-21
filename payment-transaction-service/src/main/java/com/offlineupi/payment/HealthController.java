package com.offlineupi.payment;

import java.time.Instant;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthController {

    public record ServiceStatus(String service, String status, Instant timestamp) {
    }

    @GetMapping("/")
    public ServiceStatus root() {
        return new ServiceStatus("payment-transaction-service", "UP", Instant.now());
    }
}
