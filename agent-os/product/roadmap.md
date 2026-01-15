# Product Roadmap

1. [x] Docker Compose Setup — Configure Docker Compose with Kafka and Zookeeper services, including health checks and proper networking for local development `S`

2. [ ] Kafka Producer and Consumer Infrastructure — Create KafkaJS service module with connection management, producer instance, and consumer group setup for all four topics `S`

3. [ ] Express API with WebSocket Integration — Set up Express server with Socket.io for real-time browser updates, including event emission when messages are consumed from Kafka `S`

4. [ ] React Dashboard Layout — Build the main dashboard page with Vite and Tailwind CSS, including four topic widgets (message count + log) and the order entry form `M`

5. [ ] Order Creation Flow — Implement the order entry form that publishes to order-created topic, with the consumer that generates N random product strings per order `M`

6. [ ] Product Review Logic — Add random review chance logic to product generation, publishing to product-needs-review when flagged, and tracking pending products per order `M`

7. [ ] Products Needing Review List — Create the review list component that consumes product-needs-review messages, displays pending products, and handles click-to-approve actions `M`

8. [ ] Product Matched and Import Completion — Implement product-matched publishing on approval, track remaining products per order, and publish import-requested when all products are processed `M`

> Notes
> - Order items by technical dependencies and product architecture
> - Each item should represent an end-to-end (frontend + backend) functional and testable feature
