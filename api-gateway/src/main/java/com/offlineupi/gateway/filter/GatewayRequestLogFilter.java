package com.offlineupi.gateway.filter;

import com.offlineupi.gateway.entity.GatewayRequestLog;
import com.offlineupi.gateway.repository.GatewayRequestLogRepository;
import java.net.ConnectException;
import java.net.UnknownHostException;
import java.time.Instant;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

@Component
public class GatewayRequestLogFilter implements WebFilter {

    private static final Logger log = LoggerFactory.getLogger(GatewayRequestLogFilter.class);

    private final GatewayRequestLogRepository gatewayRequestLogRepository;

    public GatewayRequestLogFilter(GatewayRequestLogRepository gatewayRequestLogRepository) {
        this.gatewayRequestLogRepository = gatewayRequestLogRepository;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        String path = exchange.getRequest().getURI().getPath();
        if (path.startsWith("/api/")) {
            String method = exchange.getRequest().getMethod().name();
            log.info("Gateway API request received: method={}, path={}, query={}, remoteAddress={}",
                    method,
                    path,
                    exchange.getRequest().getURI().getQuery(),
                    exchange.getRequest().getRemoteAddress());
            Mono.fromRunnable(() -> gatewayRequestLogRepository.save(new GatewayRequestLog(method, path, Instant.now())))
                    .subscribeOn(Schedulers.boundedElastic())
                    .doOnError(error -> log.error(
                            "Failed to persist gateway request log: method={}, path={}, query={}, remoteAddress={}, error={}",
                            method,
                            path,
                            exchange.getRequest().getURI().getQuery(),
                            exchange.getRequest().getRemoteAddress(),
                            error.getMessage(),
                            error))
                    .subscribe(
                            ignored -> {
                            },
                            error -> {
                            });
        }
        return chain.filter(exchange)
                .doOnError(error -> logGatewayRequestFailure(exchange, path, error));
    }

    private void logGatewayRequestFailure(ServerWebExchange exchange, String path, Throwable error) {
        if (hasCause(error, UnknownHostException.class) || hasCause(error, ConnectException.class)) {
            return;
        }

        HttpStatusCode statusCode = exchange.getResponse().getStatusCode();
        if (statusCode == null && error instanceof ResponseStatusException responseStatusException) {
            statusCode = responseStatusException.getStatusCode();
        }

        if (HttpStatus.NOT_FOUND.equals(statusCode) && !path.startsWith("/api/")) {
            log.warn("Gateway resource not found: method={}, path={}, query={}, remoteAddress={}",
                    exchange.getRequest().getMethod(),
                    path,
                    exchange.getRequest().getURI().getQuery(),
                    exchange.getRequest().getRemoteAddress());
            return;
        }

        log.error(
                "Gateway request failed: method={}, path={}, query={}, remoteAddress={}, statusCode={}, error={}",
                exchange.getRequest().getMethod(),
                path,
                exchange.getRequest().getURI().getQuery(),
                exchange.getRequest().getRemoteAddress(),
                statusCode,
                error.getMessage(),
                error);
    }

    private boolean hasCause(Throwable error, Class<? extends Throwable> causeType) {
        Throwable current = error;
        while (current != null) {
            if (causeType.isInstance(current)) {
                return true;
            }
            current = current.getCause();
        }
        return false;
    }
}
