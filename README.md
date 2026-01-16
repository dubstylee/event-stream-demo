# Event Stream Demo

A proof-of-concept application demonstrating Kafka event streaming patterns with real-time visualization. This interactive dashboard helps developers understand event-driven architecture by showing message flows across multiple topics in real-time.

## Overview

This project showcases a complete event-driven workflow where users can:
- Create orders that trigger events across multiple Kafka topics
- Review products that require manual approval
- Watch real-time message flows through a WebSocket-powered dashboard
- Learn Kafka patterns like conditional routing and event aggregation

**Key Patterns Demonstrated:**
- Producer/Consumer workflows
- Event chaining across topics
- Conditional event routing (products randomly requiring review)
- Event aggregation (import-requested fires when all products are processed)

## Tech Stack

- **Runtime:** Bun
- **Backend:** Express + Socket.io
- **Frontend:** React + Vite + Tailwind CSS
- **Message Broker:** Apache Kafka + KafkaJS
- **Infrastructure:** Docker Compose (Kafka + Zookeeper)
- **Testing:** Vitest

## Prerequisites

- [Bun](https://bun.sh) v1.3.4 or later
- [Docker](https://www.docker.com/) and Docker Compose
- Modern web browser

## Quick Start

### 1. Start Kafka Infrastructure

Start Kafka and Zookeeper using Docker Compose:

```bash
docker compose up -d
```

This will:
- Start Kafka on `localhost:9092`
- Start Zookeeper on port 2181 (internal)
- Auto-create four topics: `order-created`, `product-needs-review`, `product-matched`, `import-requested`

Verify services are healthy:

```bash
docker compose ps
```

### 2. Install Dependencies

Install backend dependencies:

```bash
bun install
```

Install frontend dependencies:

```bash
cd client
bun install
cd ..
```

### 3. Run the Backend

Start the Express + Socket.io server with Kafka consumers:

```bash
bun run src/app.js
```

The backend will:
- Listen on port 3000 (configurable in `src/server/config.json`)
- Connect to Kafka at `localhost:9092`
- Start consumers for all four topics
- Serve HTTP API endpoints at `/api/*`
- Provide WebSocket connections for real-time updates

### 4. Run the Frontend

In a new terminal, start the React development server:

```bash
cd client
bun run dev
```

The frontend will open at `http://localhost:5173` (default Vite port).

## Available Endpoints

### HTTP API

- **GET** `/api/health` - Health check endpoint
- **GET** `/api/kafka/status` - Kafka connection status
- **POST** `/api/kafka/produce` - Send messages to Kafka topics
  ```json
  {
    "topic": "order-created",
    "message": { "orderId": "ORD-123", "productCount": 5 }
  }
  ```

### WebSocket Events

- **Client → Server:** `subscribe:topic`, `unsubscribe:topic`
- **Server → Client:** `kafka:message` (real-time topic messages)

## Kafka Topics

| Topic Name | Purpose |
|------------|---------|
| `order-created` | User creates a new order with orderId and productCount |
| `product-needs-review` | Products randomly requiring manual approval (30% chance) |
| `product-matched` | User approves a product from the review queue |
| `import-requested` | Fires when all products for an order are processed |

## Project Structure

```
event-stream-demo/
├── src/
│   ├── app.js                    # Express server + Socket.io setup
│   ├── kafka/
│   │   ├── index.js              # Kafka client orchestration
│   │   ├── producer.js           # Message producer
│   │   ├── consumer.js           # Multi-topic consumer
│   │   ├── order-handler.js      # Order processing logic
│   │   └── product-matched-handler.js  # Product approval logic
│   └── server/
│       └── config.json           # Server configuration
├── client/                       # React frontend (see client/README.md)
├── docker-compose.yml            # Kafka infrastructure
└── package.json                  # Backend dependencies
```

## Development Commands

### Backend

```bash
# Run server
bun run src/app.js

# Run tests
bun test

# Run specific test file
bun test src/kafka/__tests__/consumer.test.js
```

### Infrastructure

```bash
# Start Kafka
docker compose up -d

# View logs
docker compose logs -f

# Stop services
docker compose down

# Stop and remove volumes
docker compose down -v
```

## Testing the Event Flow

1. Open the dashboard at `http://localhost:5173`
2. Enter an order ID (e.g., "ORD-123") and product count (e.g., 5)
3. Click "Create Order" - watch the `order-created` topic widget
4. Approximately 30% of products will appear in the "Products Needing Review" section
5. Click "Approve" on products - watch the `product-matched` topic widget
6. When all products are processed, see the `import-requested` event fire

## Configuration

### Backend Configuration

Edit `src/server/config.json`:

```json
{
  "port": 3000,
  "kafka": {
    "initTimeout": 30000
  },
  "shutdown": {
    "timeout": 5000
  },
  "cors": {
    "credentials": true
  }
}
```

### Kafka Configuration

Edit `src/kafka/config.json` for Kafka client settings:

```json
{
  "clientId": "event-stream-demo",
  "brokers": ["localhost:9092"],
  "groupId": "event-stream-demo-group"
}
```

## Troubleshooting

### Kafka Connection Issues

If the backend can't connect to Kafka:

1. Verify Kafka is running: `docker compose ps`
2. Check Kafka logs: `docker compose logs kafka`
3. Ensure port 9092 is not in use: `lsof -i :9092`

### Frontend WebSocket Issues

If the dashboard shows "Disconnected":

1. Verify backend is running on port 3000
2. Check browser console for connection errors
3. Verify CORS configuration in `src/app.js`

### Topic Creation Issues

If topics aren't created automatically:

```bash
# Recreate topics manually
docker compose exec kafka kafka-topics --bootstrap-server localhost:9092 --create --if-not-exists --topic order-created --partitions 1 --replication-factor 1
```

## Learn More

- [KafkaJS Documentation](https://kafka.js.org/)
- [Socket.io Documentation](https://socket.io/docs/)
- [Bun Documentation](https://bun.sh/docs)
- [React Documentation](https://react.dev/)

## License

MIT

---

**Built with Bun** 🍞
