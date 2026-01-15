# Tech Stack

## Framework and Runtime

- **Language/Runtime:** JavaScript, Bun
- **Package Manager:** bun

## Frontend

- **Build Tool:** Vite
- **JavaScript Framework:** React
- **CSS Framework:** Tailwind CSS

## Backend

- **Server Framework:** Express
- **WebSockets:** Socket.io (real-time dashboard updates)

## Message Streaming

- **Message Broker:** Apache Kafka
- **Kafka Client Library:** KafkaJS

## Local Development

- **Container Orchestration:** Docker Compose
- **Services:**
  - Kafka (message broker)
  - Zookeeper (Kafka coordination)

## Testing and Quality

- **Test Framework:** Vitest
- **Linting/Formatting:** ESLint, Prettier

## Kafka Topics

| Topic Name             | Purpose                                                 |
| ---------------------- | ------------------------------------------------------- |
| `order-created`        | Triggered when user creates a new order                 |
| `product-needs-review` | Triggered when a product requires manual review         |
| `product-matched`      | Triggered when user approves a product from review list |
| `import-requested`     | Triggered when all products for an order are processed  |
