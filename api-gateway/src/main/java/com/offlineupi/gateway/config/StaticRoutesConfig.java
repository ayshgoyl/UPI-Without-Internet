package com.offlineupi.gateway.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.MediaType;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.server.RouterFunction;
import org.springframework.web.reactive.function.server.RouterFunctions;
import org.springframework.web.reactive.function.server.ServerResponse;

import static org.springframework.web.reactive.function.server.RequestPredicates.GET;
import static org.springframework.web.reactive.function.server.RequestPredicates.HEAD;

@Configuration
public class StaticRoutesConfig {

    @Bean
    public RouterFunction<ServerResponse> staticRoutes() {
        return RouterFunctions
                .route(GET("/"), request -> ServerResponse.ok()
                        .contentType(MediaType.TEXT_HTML)
                        .body(BodyInserters.fromResource(new ClassPathResource("static/index.html"))))
                .andRoute(HEAD("/"), request -> ServerResponse.ok().build())
                .andRoute(GET("/index.html"), request -> ServerResponse.ok()
                        .contentType(MediaType.TEXT_HTML)
                        .body(BodyInserters.fromResource(new ClassPathResource("static/index.html"))))
                .andRoute(GET("/app.js"), request -> ServerResponse.ok()
                        .contentType(MediaType.valueOf("application/javascript"))
                        .body(BodyInserters.fromResource(new ClassPathResource("static/app.js"))))
                .andRoute(GET("/style.css"), request -> ServerResponse.ok()
                        .contentType(MediaType.valueOf("text/css"))
                        .body(BodyInserters.fromResource(new ClassPathResource("static/style.css"))));
    }
}
