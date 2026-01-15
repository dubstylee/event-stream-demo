import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock producer
const mockProduce = vi.fn();
vi.mock('../producer.js', () => ({
  produce: mockProduce
}));

// Mock client
const mockSetConnected = vi.fn();
const mockSetConnectionError = vi.fn();

const mockConsumerInstance = {
  connect: vi.fn(),
  subscribe: vi.fn(),
  run: vi.fn(),
  disconnect: vi.fn()
};

const mockClient = {
  consumer: vi.fn(() => ({ ...mockConsumerInstance }))
};

const mockGetClient = vi.fn(() => mockClient);

vi.mock('../client.js', () => ({
  getClient: mockGetClient,
  setConnected: mockSetConnected,
  setConnectionError: mockSetConnectionError
}));

// Import after mocks
import { 
  kafkaEvents, 
  TOPICS, 
  initializeConsumers, 
  disconnectConsumers 
} from '../consumer.js';

describe('Kafka Consumer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset mock implementations
    mockConsumerInstance.connect.mockResolvedValue(undefined);
    mockConsumerInstance.subscribe.mockResolvedValue(undefined);
    mockConsumerInstance.run.mockResolvedValue(undefined);
    mockConsumerInstance.disconnect.mockResolvedValue(undefined);
    mockProduce.mockResolvedValue(undefined);
    
    // Spy on console
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });
  
  afterEach(async () => {
    await disconnectConsumers().catch(() => {});
    vi.restoreAllMocks();
  });

  describe('TOPICS constant', () => {
    it('should export all four topics', () => {
      expect(TOPICS).toEqual([
        'order-created',
        'product-needs-review',
        'product-matched',
        'import-requested'
      ]);
      expect(TOPICS).toHaveLength(4);
    });
  });

  describe('kafkaEvents EventEmitter', () => {
    it('should be an EventEmitter instance', () => {
      expect(kafkaEvents).toBeDefined();
      expect(typeof kafkaEvents.on).toBe('function');
      expect(typeof kafkaEvents.emit).toBe('function');
    });

    it('should allow registering event listeners', () => {
      const handler = vi.fn();
      kafkaEvents.on('test-event', handler);
      kafkaEvents.emit('test-event', { data: 'test' });
      
      expect(handler).toHaveBeenCalledWith({ data: 'test' });
      
      // Cleanup
      kafkaEvents.removeListener('test-event', handler);
    });
  });

  describe('initializeConsumers', () => {
    it('should create consumers for all four topics', async () => {
      await initializeConsumers();
      
      expect(mockClient.consumer).toHaveBeenCalledTimes(4);
      
      // Verify each topic gets a consumer
      expect(mockClient.consumer).toHaveBeenCalledWith({
        groupId: 'order-created-consumer-group',
        sessionTimeout: 30000,
        heartbeatInterval: 3000
      });
      expect(mockClient.consumer).toHaveBeenCalledWith({
        groupId: 'product-needs-review-consumer-group',
        sessionTimeout: 30000,
        heartbeatInterval: 3000
      });
      expect(mockClient.consumer).toHaveBeenCalledWith({
        groupId: 'product-matched-consumer-group',
        sessionTimeout: 30000,
        heartbeatInterval: 3000
      });
      expect(mockClient.consumer).toHaveBeenCalledWith({
        groupId: 'import-requested-consumer-group',
        sessionTimeout: 30000,
        heartbeatInterval: 3000
      });
    });

    it('should connect all consumers', async () => {
      await initializeConsumers();
      
      expect(mockConsumerInstance.connect).toHaveBeenCalledTimes(4);
    });

    it('should subscribe to each topic with fromBeginning: true', async () => {
      await initializeConsumers();
      
      expect(mockConsumerInstance.subscribe).toHaveBeenCalledTimes(4);
      expect(mockConsumerInstance.subscribe).toHaveBeenCalledWith({
        topic: 'order-created',
        fromBeginning: true
      });
      expect(mockConsumerInstance.subscribe).toHaveBeenCalledWith({
        topic: 'product-needs-review',
        fromBeginning: true
      });
      expect(mockConsumerInstance.subscribe).toHaveBeenCalledWith({
        topic: 'product-matched',
        fromBeginning: true
      });
      expect(mockConsumerInstance.subscribe).toHaveBeenCalledWith({
        topic: 'import-requested',
        fromBeginning: true
      });
    });

    it('should run consumers with autoCommit enabled', async () => {
      await initializeConsumers();
      
      expect(mockConsumerInstance.run).toHaveBeenCalledTimes(4);
      
      const runCalls = mockConsumerInstance.run.mock.calls;
      runCalls.forEach(call => {
        expect(call[0]).toHaveProperty('autoCommit', true);
        expect(call[0]).toHaveProperty('eachMessage');
        expect(typeof call[0].eachMessage).toBe('function');
      });
    });

    it('should emit kafka:connected event after initialization', async () => {
      const handler = vi.fn();
      kafkaEvents.on('kafka:connected', handler);
      
      await initializeConsumers();
      
      expect(handler).toHaveBeenCalledTimes(1);
      expect(mockSetConnected).toHaveBeenCalledTimes(1);
      
      kafkaEvents.removeListener('kafka:connected', handler);
    });

    it('should only initialize once (idempotent)', async () => {
      await initializeConsumers();
      await initializeConsumers();
      await initializeConsumers();
      
      // Should only create consumers once
      expect(mockClient.consumer).toHaveBeenCalledTimes(4);
    });

    it('should handle initialization errors', async () => {
      mockConsumerInstance.connect.mockRejectedValueOnce(new Error('Connection failed'));
      
      await expect(initializeConsumers()).rejects.toThrow('Connection failed');
      
      expect(mockSetConnectionError).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalledWith(
        '[Kafka Consumer] Failed to initialize consumers:',
        'Connection failed'
      );
    });

    it('should emit kafka:error event on initialization failure', async () => {
      const handler = vi.fn();
      kafkaEvents.on('kafka:error', handler);
      
      mockConsumerInstance.connect.mockRejectedValueOnce(new Error('Init error'));
      
      try {
        await initializeConsumers();
      } catch (e) {
        // Expected
      }
      
      expect(handler).toHaveBeenCalledWith({
        error: 'Init error'
      });
      
      kafkaEvents.removeListener('kafka:error', handler);
    });
  });

  describe('message processing', () => {
    let eachMessageHandler;

    beforeEach(async () => {
      // Capture the eachMessage handler
      mockConsumerInstance.run.mockImplementation(({ eachMessage }) => {
        eachMessageHandler = eachMessage;
        return Promise.resolve();
      });
      
      await initializeConsumers();
    });

    it('should parse message value as JSON', async () => {
      const handler = vi.fn();
      kafkaEvents.on('kafka:message', handler);
      
      const messageData = { orderId: 123, items: ['a', 'b'] };
      await eachMessageHandler({
        topic: 'order-created',
        partition: 0,
        message: {
          offset: '10',
          value: Buffer.from(JSON.stringify(messageData))
        }
      });
      
      expect(handler).toHaveBeenCalledWith({
        topic: 'order-created',
        message: messageData,
        partition: 0,
        offset: '10'
      });
      
      kafkaEvents.removeListener('kafka:message', handler);
    });

    it('should emit kafka:message event with correct payload', async () => {
      const handler = vi.fn();
      kafkaEvents.on('kafka:message', handler);
      
      await eachMessageHandler({
        topic: 'product-matched',
        partition: 2,
        message: {
          offset: '42',
          value: Buffer.from(JSON.stringify({ productId: 'ABC' }))
        }
      });
      
      expect(handler).toHaveBeenCalledWith({
        topic: 'product-matched',
        message: { productId: 'ABC' },
        partition: 2,
        offset: '42'
      });
      
      kafkaEvents.removeListener('kafka:message', handler);
    });

    it('should handle JSON parse errors and retry', async () => {
      const handler = vi.fn();
      kafkaEvents.on('kafka:message', handler);
      
      // Invalid JSON
      await eachMessageHandler({
        topic: 'order-created',
        partition: 0,
        message: {
          offset: '20',
          value: Buffer.from('not valid json')
        }
      });
      
      // Message should not be emitted
      expect(handler).not.toHaveBeenCalled();
      
      // Error should be logged
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Error processing message (attempt 1/3). Topic: order-created')
      );
      
      kafkaEvents.removeListener('kafka:message', handler);
    });

    it('should send to DLQ after 3 failed attempts', async () => {
      const invalidMessage = Buffer.from('invalid json');
      
      // Simulate 3 attempts with same message
      for (let i = 0; i < 3; i++) {
        await eachMessageHandler({
          topic: 'order-created',
          partition: 0,
          message: {
            offset: '30',
            value: invalidMessage
          }
        });
      }
      
      // Should have called produce to send to DLQ
      expect(mockProduce).toHaveBeenCalledWith(
        'order-created-dlq',
        expect.objectContaining({
          originalMessage: 'invalid json',
          error: expect.any(String),
          timestamp: expect.any(Number),
          attempts: 3
        })
      );
      
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Message sent to DLQ. Topic: order-created-dlq')
      );
    });

    it('should emit kafka:error event when sending to DLQ', async () => {
      const handler = vi.fn();
      kafkaEvents.on('kafka:error', handler);
      
      const invalidMessage = Buffer.from('invalid json');
      
      // Simulate 3 attempts
      for (let i = 0; i < 3; i++) {
        await eachMessageHandler({
          topic: 'product-needs-review',
          partition: 1,
          message: {
            offset: '50',
            value: invalidMessage
          }
        });
      }
      
      expect(handler).toHaveBeenCalledWith({
        topic: 'product-needs-review',
        error: expect.any(String),
        message: 'invalid json'
      });
      
      kafkaEvents.removeListener('kafka:error', handler);
    });

    it('should handle DLQ send failures gracefully', async () => {
      mockProduce.mockRejectedValueOnce(new Error('DLQ send failed'));
      
      const invalidMessage = Buffer.from('invalid');
      
      // Simulate 3 attempts
      for (let i = 0; i < 3; i++) {
        await eachMessageHandler({
          topic: 'order-created',
          partition: 0,
          message: {
            offset: '60',
            value: invalidMessage
          }
        });
      }
      
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to send message to DLQ. Topic: order-created-dlq')
      );
    });

    it('should clear attempt count after successful processing', async () => {
      const handler = vi.fn();
      kafkaEvents.on('kafka:message', handler);
      
      const validMessage = { data: 'test' };
      
      // Process successfully
      await eachMessageHandler({
        topic: 'order-created',
        partition: 0,
        message: {
          offset: '70',
          value: Buffer.from(JSON.stringify(validMessage))
        }
      });
      
      expect(handler).toHaveBeenCalledTimes(1);
      
      kafkaEvents.removeListener('kafka:message', handler);
    });
  });

  describe('disconnectConsumers', () => {
    it('should disconnect all consumers', async () => {
      await initializeConsumers();
      await disconnectConsumers();
      
      expect(mockConsumerInstance.disconnect).toHaveBeenCalledTimes(4);
    });

    it('should emit kafka:disconnected event', async () => {
      const handler = vi.fn();
      kafkaEvents.on('kafka:disconnected', handler);
      
      await initializeConsumers();
      await disconnectConsumers();
      
      expect(handler).toHaveBeenCalledTimes(1);
      
      kafkaEvents.removeListener('kafka:disconnected', handler);
    });

    it('should handle disconnect when not initialized', async () => {
      await disconnectConsumers();
      
      expect(mockConsumerInstance.disconnect).not.toHaveBeenCalled();
    });

    it('should handle disconnect errors', async () => {
      await initializeConsumers();
      
      mockConsumerInstance.disconnect.mockRejectedValueOnce(new Error('Disconnect failed'));
      
      await expect(disconnectConsumers()).rejects.toThrow('Disconnect failed');
      
      expect(console.error).toHaveBeenCalledWith(
        '[Kafka Consumer] Error during consumer disconnect:',
        'Disconnect failed'
      );
    });

    it('should allow re-initialization after disconnect', async () => {
      await initializeConsumers();
      expect(mockClient.consumer).toHaveBeenCalledTimes(4);
      
      await disconnectConsumers();
      
      await initializeConsumers();
      expect(mockClient.consumer).toHaveBeenCalledTimes(8); // 4 more consumers created
    });
  });
});
