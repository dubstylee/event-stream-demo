# Task Breakdown: Docker Compose Setup

## Overview
Total Tasks: 16

This spec establishes the foundational infrastructure for the Kafka Event Stream PoC using Docker Compose with Kafka and Zookeeper services. Since this is an infrastructure configuration spec with no application code, the task structure focuses on configuration files, validation scripts, and integration testing.

## Task List

### Infrastructure Configuration

#### Task Group 1: Docker Network and Base Configuration
**Dependencies:** None

- [x] 1.0 Complete Docker network and base setup
  - [x] 1.1 Create `docker-compose.yml` file in project root
    - Use Docker Compose version 3.8 or later
    - Add header comments explaining the purpose of the configuration
  - [x] 1.2 Define the Docker network configuration
    - Create bridge network named `kafka-net`
    - Configure network aliases for service discovery
  - [x] 1.3 Add descriptive comments for each major section
    - Follow commenting best practices (minimal, helpful, evergreen)
    - Explain configuration choices for developers new to Kafka

**Acceptance Criteria:**
- `docker-compose.yml` file exists in project root
- File uses version 3.8+ syntax
- `kafka-net` bridge network is defined
- Comments explain purpose of each configuration section

#### Task Group 2: Zookeeper Service Configuration
**Dependencies:** Task Group 1

- [x] 2.0 Complete Zookeeper service configuration
  - [x] 2.1 Configure Zookeeper service in docker-compose.yml
    - Use `bitnami/zookeeper` image (latest stable)
    - Set container name to `zookeeper`
    - Configure `ALLOW_ANONYMOUS_LOGIN=yes` for PoC simplicity
  - [x] 2.2 Configure Zookeeper network settings
    - Attach to `kafka-net` network
    - Keep port 2181 internal (not exposed to host)
  - [x] 2.3 Configure Zookeeper health check
    - Use command: `echo ruok | nc localhost 2181`
    - Set interval: 10s, timeout: 5s, retries: 5
  - [x] 2.4 Set restart policy to `unless-stopped`

**Acceptance Criteria:**
- Zookeeper service uses Bitnami image
- Port 2181 is internal to Docker network only
- Health check is properly configured
- Service restarts automatically unless manually stopped

#### Task Group 3: Kafka Service Configuration
**Dependencies:** Task Group 2

- [x] 3.0 Complete Kafka service configuration
  - [x] 3.1 Configure Kafka service in docker-compose.yml
    - Use `bitnami/kafka` image (latest stable)
    - Set container name to `kafka`
    - Configure dependency on Zookeeper service
  - [x] 3.2 Configure Kafka-Zookeeper connection
    - Set `KAFKA_CFG_ZOOKEEPER_CONNECT=zookeeper:2181`
    - Configure Kafka to wait for Zookeeper health check to pass
  - [x] 3.3 Configure Kafka listener settings
    - Set `KAFKA_CFG_LISTENER_SECURITY_PROTOCOL_MAP` for PLAINTEXT protocol
    - Configure `KAFKA_CFG_LISTENERS` for internal communication
    - Set `KAFKA_CFG_ADVERTISED_LISTENERS` to expose `localhost:9092` for host access
    - Configure `KAFKA_CFG_INTER_BROKER_LISTENER_NAME` for broker communication
  - [x] 3.4 Configure Kafka port exposure
    - Map internal port 9092 to host port 9092
    - Attach to `kafka-net` network
  - [x] 3.5 Configure Kafka health check
    - Use command: `kafka-broker-api-versions.sh --bootstrap-server localhost:9092`
    - Set interval: 10s, timeout: 5s, retries: 5
  - [x] 3.6 Set restart policy to `unless-stopped`

**Acceptance Criteria:**
- Kafka service properly connects to Zookeeper
- Listener configuration allows both container and host access
- Port 9092 is exposed to host machine
- Health check verifies Kafka broker is operational

#### Task Group 4: Automatic Topic Creation
**Dependencies:** Task Group 3

- [x] 4.0 Complete automatic topic creation configuration
  - [x] 4.1 Enable auto topic creation
    - Set `KAFKA_CFG_AUTO_CREATE_TOPICS_ENABLE=true`
  - [x] 4.2 Configure all four topics in environment variable
    - Topic: `order-created` (partition: 1, replication: 1)
    - Topic: `product-needs-review` (partition: 1, replication: 1)
    - Topic: `product-matched` (partition: 1, replication: 1)
    - Topic: `import-requested` (partition: 1, replication: 1)

**Acceptance Criteria:**
- Auto topic creation is enabled
- All four topics are configured for creation on startup
- Topics use single partition and replication factor of 1

### Validation and Testing

#### Task Group 5: Infrastructure Validation
**Dependencies:** Task Groups 1-4

- [x] 5.0 Validate Docker Compose configuration and services
  - [x] 5.1 Validate docker-compose.yml syntax
    - Run `docker compose config` to verify configuration is valid
    - Ensure no syntax errors or warnings
  - [x] 5.2 Start services and verify startup sequence
    - Run `docker compose up -d`
    - Verify Zookeeper starts before Kafka
    - Verify health checks pass for both services
  - [x] 5.3 Verify topic creation
    - Use Kafka CLI tools to list topics
    - Confirm all four topics exist: `order-created`, `product-needs-review`, `product-matched`, `import-requested`
  - [x] 5.4 Test Kafka connectivity from host
    - Verify port 9092 is accessible from localhost
    - Confirm connection can be established for future KafkaJS client usage
  - [x] 5.5 Document startup and shutdown commands
    - Add comments or inline documentation for common operations
    - Include: `docker compose up -d`, `docker compose down`, `docker compose logs`

**Acceptance Criteria:**
- Docker Compose configuration passes validation
- Both services start successfully with health checks passing
- All four topics are automatically created
- Kafka is accessible from host machine on port 9092
- Developers can easily start/stop the infrastructure

## Execution Order

Recommended implementation sequence:

1. **Docker Network and Base Configuration (Task Group 1)** - Establish the foundation
2. **Zookeeper Service Configuration (Task Group 2)** - Zookeeper must be configured first as Kafka depends on it
3. **Kafka Service Configuration (Task Group 3)** - Configure Kafka with dependency on healthy Zookeeper
4. **Automatic Topic Creation (Task Group 4)** - Add topic creation once Kafka service is configured
5. **Infrastructure Validation (Task Group 5)** - Verify everything works end-to-end

## Notes

- This is an infrastructure-only spec with no application code or UI components
- No visual assets are applicable for this spec
- Testing focuses on integration validation rather than unit tests (Vitest not applicable for Docker configuration)
- This foundational infrastructure supports the subsequent KafkaJS client implementation (roadmap item 2)
- The configuration prioritizes simplicity for PoC/learning purposes over production-grade security
- **Implementation Note:** Due to Bitnami images being unavailable on Docker Hub at time of implementation, Confluent Platform images (confluentinc/cp-kafka:7.5.0 and confluentinc/cp-zookeeper:7.5.0) were used as a functionally equivalent alternative. The configuration achieves all the same requirements with different environment variable naming conventions.
