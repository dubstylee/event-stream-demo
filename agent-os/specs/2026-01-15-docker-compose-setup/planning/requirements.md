# Spec Requirements: Docker Compose Setup

## Initial Description

Configure Docker Compose with Kafka and Zookeeper services for local development. This is the first item on the product roadmap and provides the foundational infrastructure for the Kafka Event Stream PoC application.

## Requirements Discussion

### First Round Questions

**Q1:** Which Kafka Docker images should be used?
**Answer:** Use Bitnami Kafka and Zookeeper images.

**Q2:** How many Kafka brokers are needed?
**Answer:** Single Kafka broker (no clustering needed for PoC).

**Q3:** How should the four topics be created?
**Answer:** Auto-create the four topics on startup (order-created, product-needs-review, product-matched, import-requested).

**Q4:** What ports should be exposed?
**Answer:** Expose Kafka on standard port 9092. Only expose Zookeeper port 2181 if needed outside Docker network (otherwise keep internal).

**Q5:** What health checks should be configured?
**Answer:** Basic health checks: kafka-broker-api-versions for Kafka, ruok for Zookeeper.

**Q6:** What Docker network configuration is needed?
**Answer:** Use dedicated Docker network named `kafka-net`.

**Q7:** Should a Kafka management UI be included?
**Answer:** Kafka management UI is OUT OF SCOPE.

**Q8:** Are there any other explicit exclusions?
**Answer:** No explicit exclusions.

### Existing Code to Reference

No similar existing features identified for reference.

### Follow-up Questions

None required - all questions were answered comprehensively.

## Visual Assets

### Files Provided:

No visual assets provided.

### Visual Insights:

Not applicable - this is an infrastructure/configuration spec with no UI components.

## Requirements Summary

### Functional Requirements

- Docker Compose configuration file with Kafka and Zookeeper services
- Bitnami Docker images for both Kafka and Zookeeper
- Single Kafka broker configuration (non-clustered)
- Automatic topic creation on startup for all four topics:
  - `order-created`
  - `product-needs-review`
  - `product-matched`
  - `import-requested`
- Health check configuration for both services
- Dedicated Docker network for service communication

### Technical Specifications

**Docker Images:**
- `bitnami/kafka` (latest stable)
- `bitnami/zookeeper` (latest stable)

**Network Configuration:**
- Network name: `kafka-net`
- Kafka port 9092 exposed to host
- Zookeeper port 2181 internal only (unless external access required)

**Health Checks:**
- Kafka: `kafka-broker-api-versions` command
- Zookeeper: `ruok` command

**Topic Configuration:**
- Auto-create enabled on startup
- Topics: order-created, product-needs-review, product-matched, import-requested

### Reusability Opportunities

- None identified - this is the first spec in the project

### Scope Boundaries

**In Scope:**
- Docker Compose configuration file (`docker-compose.yml`)
- Kafka single-broker setup with Bitnami image
- Zookeeper setup with Bitnami image
- Automatic topic creation for all four topics
- Health checks for both services
- Dedicated Docker network (`kafka-net`)
- Port exposure configuration

**Out of Scope:**
- Kafka management UI (e.g., Kafka UI, AKHQ, Conduktor)
- Multi-broker clustering
- Production-grade security configurations
- Persistent volume configuration (PoC only)
- SSL/TLS configuration

### Technical Considerations

- This is the foundational infrastructure for the entire PoC
- Must work with KafkaJS client library (roadmap item 2)
- Single broker is sufficient for learning/demo purposes
- Bitnami images provide simpler configuration than Confluent images
- Health checks ensure services are ready before dependent services start
- Topics auto-created avoids manual setup steps for new developers
