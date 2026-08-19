# Build from repository root: docker build -f sync-notification-service/Dockerfile .
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app

COPY pom.xml .
COPY user-account-service/pom.xml user-account-service/
COPY payment-transaction-service/pom.xml payment-transaction-service/
COPY wallet-balance-service/pom.xml wallet-balance-service/
COPY qr-payment-service/pom.xml qr-payment-service/
COPY sync-notification-service/pom.xml sync-notification-service/
COPY api-gateway/pom.xml api-gateway/

RUN mvn dependency:go-offline -pl sync-notification-service -am -B -q || true

COPY . .
RUN mvn clean package -pl sync-notification-service -am -DskipTests -B -q

FROM eclipse-temurin:21-jre-jammy
WORKDIR /app
COPY --from=build /app/sync-notification-service/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]
