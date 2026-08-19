package com.offlineupi.sync;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.retry.annotation.EnableRetry;

@SpringBootApplication
@EnableRetry
public class SyncNotificationServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(SyncNotificationServiceApplication.class, args);
    }
}
