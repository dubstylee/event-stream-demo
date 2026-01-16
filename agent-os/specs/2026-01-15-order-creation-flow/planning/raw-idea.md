# Spec Idea: Order Creation Flow

## Initial Description

Implement the order entry form that publishes to order-created topic, with the consumer that generates N random product strings per order.

## Context

This spec is part of a Kafka Event Stream PoC application. The foundational infrastructure has already been completed:
- Docker Compose with Kafka and Zookeeper ✅
- KafkaJS producer/consumer infrastructure ✅
- Express API with Socket.io for real-time updates ✅
- React Dashboard with order entry form UI (non-functional) ✅

The order entry form currently exists in `client/src/components/OrderEntryForm.jsx` but only prevents default submission. This spec will:
1. Connect the form to the Express API to publish orders
2. Implement backend logic to consume `order-created` messages
3. Generate N random product strings based on the order's product count
4. Handle the product generation logic (which will feed into subsequent specs)

## Key Questions to Resolve

1. What should the order message structure look like? (orderId, productCount, timestamp, etc.)
2. How should product strings be generated? (format, length, randomness requirements)
3. Where should the product generation logic live? (separate module, consumer handler, etc.)
4. Should products be published immediately or batched?
5. What happens to the generated products? (published to a topic, stored, etc.)
6. How should form validation work? (client-side, server-side, both)
7. What feedback should users get after submitting? (success message, error handling, etc.)
