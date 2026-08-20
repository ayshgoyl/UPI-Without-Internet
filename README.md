# UPI Payment Platform

This project is a microservices-based UPI payment platform. The frontend sends payment requests through the API Gateway directly to the Payment Transaction Service. There is no Kafka queue, offline transaction buffer, circuit breaker fallback, or retry worker in the simplified flow.

## Prerequisites & Requirements

Before you begin, ensure you have the following installed on your system:
- **Java Development Kit (JDK) 21**: Required for Spring Boot 3.5 compatibility.
- **Apache Maven (3.8+)**: For building the project and managing dependencies.
- **Docker & Docker Compose**: Useful for running PostgreSQL locally.
- **Git**: For version control.

## Project Structure

The project is structured as a Maven multi-module repository containing:
1. `user-account-service`: Manages JWT authentication and RBAC.
2. `payment-transaction-service`: Handles payment transaction requests.
3. `wallet-balance-service`: Manages balances with pessimistic database locking.
4. `qr-payment-service`: Enforces HTTPS/TLS for secure QR code data processing.
5. `api-gateway`: Serves the phone UI and routes traffic.

## Database Tables

Each service owns one PostgreSQL table and records the data available to it:

- `api-gateway`: `gateway_request_logs` records API method, path, and timestamp for routed API calls.
- `user-account-service`: `user_accounts` records the demo mobile number, VPA, role, language, and last profile access.
- `payment-transaction-service`: `payment_transactions` records payee VPA, amount, note, status, transaction ID, and timestamp for each payment initiation.
- `wallet-balance-service`: `wallets` records VPA and wallet balance.
- `qr-payment-service`: `qr_payment_records` records QR collect/pay reference, action type, VPA, amount, and timestamp.

## Setup & Installation

### 1. Database Setup (Docker)
Since this is a DevOps project, it is highly recommended to run your infrastructure via Docker.
*For full functionality, start PostgreSQL or configure each service to point to an available PostgreSQL instance.*
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

**Start Wallet Balance Service (Port 8084):**
```bash
mvn spring-boot:run -pl wallet-balance-service -Dspring-boot.run.arguments="--server.port=8084"
```

**Start QR Payment Service (Port 8085 — HTTP locally, HTTPS optional):**
```bash
mvn spring-boot:run -pl qr-payment-service
```
*(Set `SSL_ENABLED=true` and provide `keystore.p12` for local HTTPS testing.)*

## Deploying to Render

This project includes a `render.yaml` Blueprint for one-click deployment.

### Infrastructure
- **Render PostgreSQL** — shared database used by every service, with one table per service
- **Render Web Services** — one Docker container per microservice

### Steps

1. Push this repo to GitHub.
2. In [Render Dashboard](https://dashboard.render.com), create a **New Blueprint** and connect the repo.
3. Render will provision `offline-upi-db` and the web services from `render.yaml`.
4. Once deployed, open the **api-gateway** URL — the frontend UI and API are served from the same origin.

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

### 3. Payment Flow Verification
To verify the simplified payment path:
- Start the `api-gateway`, `user-account-service`, `payment-transaction-service`, `wallet-balance-service`, and `qr-payment-service`.
- Dial `*99#` in the frontend, choose Send Money, and complete the MPIN prompt.
- A successful request returns `Payment completed successfully` from `/api/v1/payments/initiate`.
- A failed request is shown as a failed payment, not as a queued transaction.
