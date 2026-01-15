# Specification: Docker Compose Setup

## Goal
Configure Docker Compose with Kafka and Zookeeper services to provide foundational infrastructure for the Kafka Event Stream PoC, enabling local development with automatic topic creation and health monitoring.

## User Stories
- As a developer new to Kafka, I want a pre-configured local environment so that I can start experimenting with event streaming without manual setup
- As a technical learner, I want all four Kafka topics auto-created on startup so that I can immediately begin exploring message flows

## Specific Requirements

**Docker Compose Configuration File**
- Create `docker-compose.yml` in project root directory
- Use Docker Compose version 3.8 or later for modern feature support
- Define clear service dependencies (Kafka depends on Zookeeper)
- Include descriptive comments for each service configuration section

**Zookeeper Service**
- Use `bitnami/zookeeper` Docker image (latest stable version)
- Configure `ALLOW_ANONYMOUS_LOGIN=yes` for simplified PoC setup
- Set container name to `zookeeper` for easy identification
- Keep port 2181 internal to Docker network (not exposed to host)
- Configure restart policy as `unless-stopped` for development convenience

**Kafka Service**
- Use `bitnami/kafka` Docker image (latest stable version)
- Configure single-broker mode (no clustering required)
- Set `KAFKA_CFG_ZOOKEEPER_CONNECT` to reference Zookeeper container
- Configure both internal and external listeners for container and host access
- Set container name to `kafka` for easy identification
- Configure restart policy as `unless-stopped`

**Port Configuration**
- Expose Kafka port 9092 to host machine for KafkaJS client connections
- Map internal port 9092 to host port 9092 (standard Kafka port)
- Zookeeper port 2181 remains internal to `kafka-net` network only

**Docker Network**
- Create dedicated bridge network named `kafka-net`
- Attach both Zookeeper and Kafka services to this network
- Use network aliases matching container names for service discovery

**Automatic Topic Creation**
- Enable `KAFKA_CFG_AUTO_CREATE_TOPICS_ENABLE=true`
- Configure `KAFKA_CFG_CREATE_TOPICS` environment variable with all four topics
- Topics to create: `order-created`, `product-needs-review`, `product-matched`, `import-requested`
- Use default partition count of 1 and replication factor of 1 for PoC simplicity

**Health Checks**
- Configure Zookeeper health check using `echo ruok | nc localhost 2181` command
- Configure Kafka health check using `kafka-broker-api-versions.sh --bootstrap-server localhost:9092`
- Set appropriate intervals (10s), timeouts (5s), and retries (5) for local development
- Kafka service should wait for Zookeeper health check to pass before starting

**Listener Configuration**
- Configure `KAFKA_CFG_LISTENER_SECURITY_PROTOCOL_MAP` for PLAINTEXT protocol
- Set `KAFKA_CFG_LISTENERS` for internal broker communication
- Set `KAFKA_CFG_ADVERTISED_LISTENERS` to expose `localhost:9092` for host access
- Configure `KAFKA_CFG_INTER_BROKER_LISTENER_NAME` for broker-to-broker communication

## Visual Design
No visual assets provided - this is an infrastructure/configuration spec with no UI components.

## Existing Code to Leverage
No existing code identified - this is the first spec in the project and establishes foundational infrastructure.

## Out of Scope
- Kafka management UI tools (Kafka UI, AKHQ, Conduktor, or similar)
- Multi-broker Kafka clustering configuration
- Production-grade security configurations (SASL, ACLs)
- SSL/TLS encryption for Kafka connections
- Persistent volume mounts for data durability
- Schema Registry integration
- Kafka Connect configuration
- Custom partition or replication strategies
- Monitoring exporters (Prometheus JMX exporter)
- Docker Compose profiles for different environments
