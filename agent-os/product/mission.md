# Product Mission

## Pitch

Kafka Event Stream PoC is a proof-of-concept application that helps developers learning Kafka understand event streaming patterns by providing an interactive dashboard with real-time visualization of message flows across multiple topics.

## Users

### Primary Customers

- **Developers New to Kafka:** Engineers looking to understand event-driven architecture and Kafka messaging patterns through hands-on experimentation
- **Technical Learners:** Students or self-taught developers studying distributed systems and event streaming concepts

### User Personas

**Junior Backend Developer** (25-35)
- **Role:** Software Engineer at a company adopting event-driven architecture
- **Context:** Needs to understand Kafka patterns before working on production systems
- **Pain Points:** Abstract documentation is hard to internalize without seeing real message flows; setting up Kafka locally is intimidating
- **Goals:** Build intuition for how producers, consumers, and topics interact; understand common patterns like event chaining

**Technical Student** (20-30)
- **Role:** Computer Science student or bootcamp graduate
- **Context:** Learning distributed systems concepts for interviews or career development
- **Pain Points:** Kafka tutorials focus on configuration rather than patterns; hard to visualize asynchronous message flows
- **Goals:** See event streaming in action; understand when events trigger other events

## The Problem

### Learning Kafka Patterns Is Abstract

Reading documentation about Kafka topics, producers, and consumers does not build intuition for how events flow through a system. Developers struggle to understand event chaining, conditional routing, and aggregation patterns without seeing them work.

**Our Solution:** Provide a visual, interactive dashboard where users can trigger events and watch messages flow through multiple topics in real-time, with clear visualization of the business logic that connects them.

## Differentiators

### Interactive Learning Over Static Examples

Unlike static code samples or documentation, this PoC lets users trigger events and immediately see the results across the system. This results in faster pattern recognition and deeper understanding of event-driven design.

### Complete End-to-End Flow

Unlike isolated examples that show one producer or one consumer, this PoC demonstrates a complete business workflow with multiple topics, conditional logic, and aggregation patterns all working together.

## Key Features

### Core Features

- **Order Creation Flow:** Users enter an order ID and product count to trigger the initial event, demonstrating how a single action can spawn multiple downstream events
- **Topic Message Visualization:** Each Kafka topic displays its message count and recent messages, making the event flow visible and traceable
- **Real-Time Dashboard Updates:** WebSocket-powered updates show messages appearing as they are published, without page refresh

### Collaboration Features

- **Products Needing Review List:** A consumable queue UI where users can see products awaiting review and take action on them, demonstrating consumer-driven workflows
- **Manual Approval Workflow:** Clicking a product triggers the product-matched event and removes it from the list, showing how user actions integrate with event streams

### Advanced Features

- **Conditional Event Routing:** Random chance determines whether products need review, demonstrating branching logic in event streams
- **Event Aggregation Pattern:** The import-requested event only fires when all products for an order are processed, demonstrating aggregation and completion detection
