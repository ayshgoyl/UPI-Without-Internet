# Offline-First UPI Payment Platform

This project is a microservices-based, offline-first UPI payment platform designed to handle transactions without continuous internet connectivity, utilizing idempotent processing and resilient retry mechanisms.

## Prerequisites & Requirements

Before you begin, ensure you have the following installed on your system:
- **Java Development Kit (JDK) 21**: Required for Spring Boot 3.5 compatibility.
- **Apache Maven (3.8+)**: For building the project and managing dependencies.
- **Docker & Docker Compose**: To easily run databases (PostgreSQL) and message brokers (Kafka/RabbitMQ) locally.
- **Git**: For version control.

## Project Structure

The project is structured as a Maven multi-module repository containing:
1. `user-account-service`: Manages JWT authentication and RBAC.
2. `payment-transaction-service`: Handles graceful degradation using Resilience4j circuit breakers.
3. `wallet-balance-service`: Manages offline balances with pessimistic database locking.
4. `qr-payment-service`: Enforces HTTPS/TLS for secure QR code data processing.
5. `sync-notification-service`: Syncs offline transactions utilizing Exponential Backoff.
6. `api-gateway`: Aggregates OpenAPI specs and routes traffic.

## Setup & Installation

### 1. Database & Broker Setup (Docker)
Since this is a DevOps project, it is highly recommended to run your infrastructure via Docker.
*Currently, the project uses in-memory or generic JPA settings, but for full functionality, you should start PostgreSQL and Kafka.*
```bash
# If you create a docker-compose.yml in the root:
docker-compose up -d
```

### 2. Build the Project
Open a terminal in the root directory (`devops-proj`) and run a clean build. This will compile all microservices:
```bash
mvn clean install -DskipTests
```
*(Note: `-DskipTests` is recommended initially until you configure your local PostgreSQL credentials in each service's `application.yml`).*

## Running the Microservices

You can run each microservice independently from the root directory using the Spring Boot Maven Plugin. Open separate terminal windows for each:

**Start API Gateway (Port 8080 — also serves the frontend UI):**
```bash
mvn spring-boot:run -pl api-gateway
```
Open `http://localhost:8080` in your browser. The frontend and API share the same origin (no CORS).

**Start User Account Service (Port 8081):**
```bash
mvn spring-boot:run -pl user-account-service -Dspring-boot.run.arguments="--server.port=8081"
```

**Start Payment Transaction Service (Port 8082):**
```bash
mvn spring-boot:run -pl payment-transaction-service -Dspring-boot.run.arguments="--server.port=8082"
```

**Start Sync Notification Service (Port 8083):**
```bash
mvn spring-boot:run -pl sync-notification-service
```

**Start QR Payment Service (Port 8085 — HTTP locally, HTTPS optional):**
```bash
mvn spring-boot:run -pl qr-payment-service
```
*(Set `SSL_ENABLED=true` and provide `keystore.p12` for local HTTPS testing.)*

## Deploying to Render

This project includes a `render.yaml` Blueprint for one-click deployment.

### Infrastructure
- **Render PostgreSQL** — shared database for payment and wallet services
- **Aiven Kafka** — message broker for offline payment events
- **Render Web Services** — one Docker container per microservice

### Steps

1. Push this repo to GitHub.
2. In [Render Dashboard](https://dashboard.render.com), create a **New Blueprint** and connect the repo.
3. Render will provision `offline-upi-db` and all six web services from `render.yaml`.
4. Set these **secret env vars** on `payment-transaction-service` and `sync-notification-service` (from your Aiven Kafka console):
   - `KAFKA_BOOTSTRAP_SERVERS` — e.g. `kafka-xxx.aivencloud.com:12345`
   - `KAFKA_SASL_JAAS_CONFIG` — e.g. `org.apache.kafka.common.security.scram.ScramLoginModule required username="avnadmin" password="YOUR_PASSWORD";`
   - `KAFKA_CA_CERT` — paste the full CA certificate PEM from Aiven
5. Once deployed, open the **api-gateway** URL — the frontend UI and API are served from the same origin.

### Local Docker build (same as Render)
```bash
docker build -f api-gateway/Dockerfile -t api-gateway .
docker build -f payment-transaction-service/Dockerfile -t payment-service .
```

## Testing & Verification

### 1. OpenAPI / Swagger UI
Once the API Gateway and the services are running, you can test the endpoints interactively using Swagger UI.
- Open your browser and navigate to: `http://localhost:8080/swagger-ui.html`
- From the dropdown in the Swagger UI, you can select the individual microservices (e.g., User Service, Payment Service) to view and test their specific REST APIs.

### 2. TLS/HTTPS Verification
To verify the QR service is enforcing TLS:
- Attempt to curl it using standard HTTP: `curl http://localhost:8443` (This should fail or reject the connection).
- Access it securely using HTTPS: `https://localhost:8443` (You may need to bypass the local self-signed certificate warning in your browser).

### 3. Graceful Degradation & Exponential Backoff
To test these features:
- **Graceful Degradation**: Stop the `wallet-balance-service`. Send a payment request to the `payment-transaction-service`. The service's `@CircuitBreaker` should catch the connection failure and fallback to offline queuing.
- **Exponential Backoff**: Check the logs of the `sync-notification-service` when it attempts to sync queued transactions without network connectivity. You should see retry attempts spaced out (e.g., 2 seconds, 4 seconds, 8 seconds).
