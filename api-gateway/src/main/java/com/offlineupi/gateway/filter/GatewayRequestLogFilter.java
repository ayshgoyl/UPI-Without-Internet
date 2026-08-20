package com.offlineupi.gateway.filter;

import com.offlineupi.gateway.entity.GatewayRequestLog;
import com.offlineupi.gateway.repository.GatewayRequestLogRepository;
import java.time.Instant;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

@Component
public class GatewayRequestLogFilter implements WebFilter {

    private final GatewayRequestLogRepository gatewayRequestLogRepository;

    public GatewayRequestLogFilter(GatewayRequestLogRepository gatewayRequestLogRepository) {
        this.gatewayRequestLogRepository = gatewayRequestLogRepository;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        String path = exchange.getRequest().getURI().getPath();
        if (path.startsWith("/api/")) {
            String method = exchange.getRequest().getMethod().name();
            Mono.fromRunnable(() -> gatewayRequestLogRepository.save(new GatewayRequestLog(method, path, Instant.now())))
                    .subscribeOn(Schedulers.boundedElastic())
                    .subscribe();
        }
        return chain.filter(exchange);
    }
}
