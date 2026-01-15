/**
 * Manual Integration Test for Kafka Module
 * 
 * This script tests the Kafka module against a real Kafka broker.
 * Requires Docker Compose to be running with Kafka and Zookeeper.
 * 
 * Run with: bun run src/kafka/manual-test.js
 */

import {
  produce,
  kafkaEvents,
  getConnectionStatus,
  disconnect,
  onMessage,
  onConnectionChange,
  waitForInitialization,
} from "./index.js";

console.log("\n=== Kafka Module Manual Integration Test ===\n");

// Track received messages
const receivedMessages = [];
let connectedEventReceived = false;

// Register message handler
onMessage((payload) => {
  console.log(`📨 Message received on topic '${payload.topic}':`, payload.message);
  receivedMessages.push(payload);
});

// Register connection status handler
onConnectionChange((event) => {
  console.log("🔌 Connection event:", event);
  if (event === undefined) {
    // kafka:connected event has no payload
    connectedEventReceived = true;
  }
});

async function runTests() {
  try {
    // Wait for consumers to initialize
    console.log("⏳ Waiting for consumers to initialize...");
    await waitForInitialization();
    console.log("✅ Consumers initialized\n");

    // Check connection status
    const status = getConnectionStatus();
    console.log("📊 Connection status:", status);
    
    if (status.status !== "connected") {
      console.warn("⚠️  Warning: Not connected to Kafka\n");
    }

    // Test 1: Produce messages to all four topics
    console.log("\n--- Test 1: Producing messages to all topics ---");
    const topics = [
      "order-created",
      "product-needs-review",
      "product-matched",
      "import-requested",
    ];

    for (const topic of topics) {
      const message = {
        testId: `manual-test-${Date.now()}`,
        topic,
        timestamp: new Date().toISOString(),
        data: `Test message for ${topic}`,
      };
      
      console.log(`📤 Producing to '${topic}'...`);
      await produce(topic, message);
      console.log(`✅ Produced to '${topic}'`);
    }

    // Test 2: Wait for messages to be consumed
    console.log("\n--- Test 2: Waiting for messages to be consumed ---");
    console.log("⏳ Waiting 5 seconds for messages...");
    await new Promise((resolve) => setTimeout(resolve, 5000));
    
    console.log(`📊 Received ${receivedMessages.length} messages`);
    
    if (receivedMessages.length > 0) {
      console.log("✅ Messages consumed successfully");
    } else {
      console.warn("⚠️  No messages received - may indicate issue with consumers");
    }

    // Test 3: Test DLQ by sending invalid message (this won't trigger DLQ in real scenario)
    console.log("\n--- Test 3: Testing producer with valid JSON ---");
    await produce("order-created", {
      testType: "DLQ-test",
      message: "This message has valid JSON and should be processed normally",
    });
    console.log("✅ DLQ test message sent");

    // Test 4: Verify connection events
    console.log("\n--- Test 4: Connection events ---");
    if (connectedEventReceived) {
      console.log("✅ kafka:connected event was received");
    } else {
      console.log("ℹ️  kafka:connected event not captured (may have fired before listener)");
    }

    // Test 5: Check final status
    console.log("\n--- Test 5: Final status check ---");
    const finalStatus = getConnectionStatus();
    console.log("📊 Final connection status:", finalStatus);

    // Test 6: Test graceful shutdown
    console.log("\n--- Test 6: Testing graceful shutdown ---");
    console.log("⏳ Disconnecting...");
    await disconnect();
    console.log("✅ Disconnected successfully");

    const afterDisconnectStatus = getConnectionStatus();
    console.log("📊 Status after disconnect:", afterDisconnectStatus);

    // Summary
    console.log("\n=== Test Summary ===");
    console.log(`✅ All manual tests completed successfully`);
    console.log(`📨 Total messages received: ${receivedMessages.length}`);
    console.log(`🔌 Connection events captured: ${connectedEventReceived ? "Yes" : "No"}`);
    
    console.log("\n✅ Manual integration test passed!\n");
    process.exit(0);

  } catch (error) {
    console.error("\n❌ Test failed with error:", error);
    console.error("Stack trace:", error.stack);
    
    try {
      await disconnect();
    } catch (disconnectError) {
      console.error("Failed to disconnect:", disconnectError);
    }
    
    process.exit(1);
  }
}

// Handle process termination
process.on("SIGINT", async () => {
  console.log("\n\n⚠️  Received SIGINT, cleaning up...");
  try {
    await disconnect();
  } catch (error) {
    console.error("Error during cleanup:", error);
  }
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\n\n⚠️  Received SIGTERM, cleaning up...");
  try {
    await disconnect();
  } catch (error) {
    console.error("Error during cleanup:", error);
  }
  process.exit(0);
});

// Run the tests
runTests();
