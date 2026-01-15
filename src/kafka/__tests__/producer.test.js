import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock client module
const mockSetConnected = vi.fn();
const mockSetConnectionError = vi.fn();
const mockProducerInstance = {
  connect: vi.fn(),
  send: vi.fn(),
  disconnect: vi.fn()
};
const mockClient = {
  producer: vi.fn(() => mockProducerInstance)
};
const mockGetClient = vi.fn(() => mockClient);

vi.mock('../client.js', () => ({
  getClient: mockGetClient,
  setConnected: mockSetConnected,
  setConnectionError: mockSetConnectionError
}));

// Import after mocks
import { produce, disconnectProducer } from '../producer.js';

describe('Kafka Producer', () => {
  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks();
    
    // Reset mock implementations
    mockProducerInstance.connect.mockResolvedValue(undefined);
    mockProducerInstance.send.mockResolvedValue(undefined);
    mockProducerInstance.disconnect.mockResolvedValue(undefined);
    
    // Spy on console methods
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });
  
  afterEach(async () => {
    // Clean up producer instance
    await disconnectProducer().catch(() => {});
    vi.restoreAllMocks();
  });

  describe('produce', () => {
    it('should initialize producer on first call', async () => {
      await produce('test-topic', { data: 'test' });
      
      expect(mockGetClient).toHaveBeenCalledTimes(1);
      expect(mockClient.producer).toHaveBeenCalledWith({
        idempotent: true,
        maxInFlightRequests: 5
      });
      expect(mockProducerInstance.connect).toHaveBeenCalledTimes(1);
      expect(mockSetConnected).toHaveBeenCalledTimes(1);
    });

    it('should reuse producer instance on subsequent calls (singleton)', async () => {
      await produce('test-topic', { data: 'test1' });
      await produce('test-topic', { data: 'test2' });
      await produce('test-topic', { data: 'test3' });
      
      expect(mockClient.producer).toHaveBeenCalledTimes(1);
      expect(mockProducerInstance.connect).toHaveBeenCalledTimes(1);
    });

    it('should serialize message to JSON', async () => {
      const message = { orderId: 123, items: ['a', 'b'] };
      await produce('test-topic', message);
      
      expect(mockProducerInstance.send).toHaveBeenCalledWith({
        topic: 'test-topic',
        messages: [{ value: JSON.stringify(message) }]
      });
    });

    it('should validate topic is non-empty string', async () => {
      await expect(produce('', { data: 'test' })).rejects.toThrow(
        'Topic must be a non-empty string'
      );
      
      await expect(produce(null, { data: 'test' })).rejects.toThrow(
        'Topic must be a non-empty string'
      );
      
      await expect(produce('   ', { data: 'test' })).rejects.toThrow(
        'Topic must be a non-empty string'
      );
    });

    it('should validate message is JSON serializable', async () => {
      // Create circular reference
      const circular = {};
      circular.self = circular;
      
      await expect(produce('test-topic', circular)).rejects.toThrow(
        'Message is not JSON serializable'
      );
    });

    it('should retry on failure with exponential backoff', async () => {
      // Fail first 2 attempts, succeed on 3rd
      mockProducerInstance.send
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(undefined);
      
      await produce('test-topic', { data: 'test' });
      
      expect(mockProducerInstance.send).toHaveBeenCalledTimes(3);
      expect(console.error).toHaveBeenCalledTimes(2); // 2 retry logs
    });

    it('should throw error after max retries', async () => {
      // Fail all attempts
      mockProducerInstance.send.mockRejectedValue(new Error('Network error'));
      
      await expect(produce('test-topic', { data: 'test' })).rejects.toThrow(
        "Failed to produce message to topic 'test-topic' after 3 attempts"
      );
      
      expect(mockProducerInstance.send).toHaveBeenCalledTimes(3);
      expect(console.error).toHaveBeenCalledTimes(3); // 2 retries + final error
    });

    it('should log retry attempts with context', async () => {
      mockProducerInstance.send
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockResolvedValueOnce(undefined);
      
      await produce('order-created', { orderId: 123 });
      
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Send failed (attempt 1/3)'),
        expect.stringContaining('Topic: order-created')
      );
    });

    it('should handle producer initialization errors', async () => {
      mockProducerInstance.connect.mockRejectedValueOnce(new Error('Connection failed'));
      
      await expect(produce('test-topic', { data: 'test' })).rejects.toThrow();
      
      expect(mockSetConnectionError).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalledWith(
        '[Kafka Producer] Failed to initialize producer:',
        'Connection failed'
      );
    });

    it('should send message successfully on first attempt', async () => {
      const message = { userId: 456, action: 'login' };
      await produce('user-events', message);
      
      expect(mockProducerInstance.send).toHaveBeenCalledTimes(1);
      expect(mockProducerInstance.send).toHaveBeenCalledWith({
        topic: 'user-events',
        messages: [{ value: JSON.stringify(message) }]
      });
    });
  });

  describe('disconnectProducer', () => {
    it('should disconnect producer if initialized', async () => {
      await produce('test-topic', { data: 'test' });
      await disconnectProducer();
      
      expect(mockProducerInstance.disconnect).toHaveBeenCalledTimes(1);
      expect(console.log).toHaveBeenCalledWith(
        '[Kafka Producer] Producer disconnected successfully'
      );
    });

    it('should handle disconnect gracefully when producer not initialized', async () => {
      await disconnectProducer();
      
      expect(mockProducerInstance.disconnect).not.toHaveBeenCalled();
    });

    it('should reset producer instance after disconnect', async () => {
      await produce('test-topic', { data: 'test' });
      const firstCallCount = mockClient.producer.mock.calls.length;
      
      await disconnectProducer();
      
      await produce('test-topic', { data: 'test' });
      const secondCallCount = mockClient.producer.mock.calls.length;
      
      // New producer instance created after disconnect
      expect(secondCallCount).toBe(firstCallCount + 1);
    });

    it('should handle disconnect errors', async () => {
      await produce('test-topic', { data: 'test' });
      
      mockProducerInstance.disconnect.mockRejectedValueOnce(new Error('Disconnect failed'));
      
      await expect(disconnectProducer()).rejects.toThrow('Disconnect failed');
      expect(console.error).toHaveBeenCalledWith(
        '[Kafka Producer] Error during producer disconnect:',
        'Disconnect failed'
      );
    });
  });

  describe('retry logic', () => {
    it('should calculate exponential backoff correctly', async () => {
      const delays = [];
      const originalSetTimeout = global.setTimeout;
      
      // Mock setTimeout to capture delays
      global.setTimeout = vi.fn((fn, delay) => {
        delays.push(delay);
        return originalSetTimeout(fn, 0); // Execute immediately
      });
      
      mockProducerInstance.send
        .mockRejectedValueOnce(new Error('Error 1'))
        .mockRejectedValueOnce(new Error('Error 2'))
        .mockResolvedValueOnce(undefined);
      
      await produce('test-topic', { data: 'test' });
      
      // Check that backoff delays were used
      expect(delays.length).toBeGreaterThan(0);
      // First retry should have initialRetryTime (100ms)
      expect(delays[0]).toBeGreaterThanOrEqual(100);
      
      global.setTimeout = originalSetTimeout;
    });

    it('should not exceed maxRetryTime', async () => {
      const delays = [];
      const originalSetTimeout = global.setTimeout;
      
      global.setTimeout = vi.fn((fn, delay) => {
        delays.push(delay);
        return originalSetTimeout(fn, 0);
      });
      
      mockProducerInstance.send
        .mockRejectedValueOnce(new Error('Error'))
        .mockRejectedValueOnce(new Error('Error'))
        .mockResolvedValueOnce(undefined);
      
      await produce('test-topic', { data: 'test' });
      
      // All delays should be <= maxRetryTime (30000ms)
      delays.forEach(delay => {
        expect(delay).toBeLessThanOrEqual(30000);
      });
      
      global.setTimeout = originalSetTimeout;
    });
  });

  describe('error messages', () => {
    it('should include context in error messages', async () => {
      mockProducerInstance.send.mockRejectedValue(new Error('Connection timeout'));
      
      try {
        await produce('important-topic', { critical: 'data' });
      } catch (error) {
        expect(error.message).toContain('important-topic');
        expect(error.message).toContain('3 attempts');
      }
    });
  });
});
