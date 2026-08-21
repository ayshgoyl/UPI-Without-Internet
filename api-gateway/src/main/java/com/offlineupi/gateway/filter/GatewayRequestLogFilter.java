package com.offlineupi.gateway.filter;

import com.offlineupi.gateway.entity.GatewayRequestLog;
import com.offlineupi.gateway.repository.GatewayRequestLogRepository;
import java.time.Instant;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
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
                .doOnError(error -> log.error(
                        "Gateway request failed: method={}, path={}, query={}, remoteAddress={}, statusCode={}, error={}",
                        exchange.getRequest().getMethod(),
                        path,
                        exchange.getRequest().getURI().getQuery(),
                        exchange.getRequest().getRemoteAddress(),
                        exchange.getResponse().getStatusCode(),
                        error.getMessage(),
                        error));
    }
}
