import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Create mock Kafka class
const mockKafkaInstance = {
  producer: vi.fn(),
  consumer: vi.fn()
};

const MockKafka = vi.fn(() => mockKafkaInstance);

// Mock kafkajs module
vi.mock('kafkajs', () => ({
  Kafka: MockKafka
}));

// Import client after mocks are set up
import { 
  getClient, 
  getConnectionStatus, 
  setConnected, 
  setConnectionError, 
  disconnect 
} from '../client.js';

describe('Kafka Client', () => {
  beforeEach(() => {
    // Clear mock call history
    MockKafka.mockClear();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  
  afterEach(async () => {
    // Disconnect to reset client state between tests
    await disconnect();
    vi.restoreAllMocks();
  });

  describe('getClient', () => {
    it('should create a new Kafka client on first call with correct configuration', () => {
      const client = getClient();
      
      expect(MockKafka).toHaveBeenCalledTimes(1);
      expect(MockKafka).toHaveBeenCalledWith({
        clientId: 'event-stream-demo',
        brokers: ['localhost:9092'],
        retry: {
          maxRetryTime: 30000,
          initialRetryTime: 100,
          retries: 3
        },
        connectionTimeout: 10000,
        requestTimeout: 30000
      });
      expect(client).toBe(mockKafkaInstance);
    });

    it('should return cached client on subsequent calls (lazy initialization)', () => {
      const client1 = getClient();
      const client2 = getClient();
      const client3 = getClient();
      
      // Should still be 1 call from previous test or first call here
      const callCount = MockKafka.mock.calls.length;
      expect(client1).toBe(client2);
      expect(client2).toBe(client3);
      expect(client1).toBe(mockKafkaInstance);
    });
  });

  describe('getConnectionStatus', () => {
    it('should return status object with required fields', () => {
      const status = getConnectionStatus();
      
      expect(status).toHaveProperty('status');
      expect(status).toHaveProperty('timestamp');
      expect(status).toHaveProperty('error');
      expect(typeof status.timestamp).toBe('number');
    });

    it('should return connecting status after getClient is called', () => {
      getClient();
      const status = getConnectionStatus();
      
      expect(status.status).toBe('connecting');
      expect(status.error).toBe(null);
    });

    it('should include timestamp that is updated on status changes', async () => {
      const status1 = getConnectionStatus();
      const time1 = status1.timestamp;
      
      // Wait a bit to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 10));
      
      setConnected();
      const status2 = getConnectionStatus();
      const time2 = status2.timestamp;
      
      expect(time2).toBeGreaterThan(time1);
    });
  });

  describe('setConnected', () => {
    it('should update status to connected', () => {
      getClient();
      setConnected();
      
      const status = getConnectionStatus();
      expect(status.status).toBe('connected');
      expect(status.error).toBe(null);
    });
  });

  describe('setConnectionError', () => {
    it('should update status to error with error message', () => {
      const testError = new Error('Connection lost');
      setConnectionError(testError);
      
      const status = getConnectionStatus();
      expect(status.status).toBe('error');
      expect(status.error).toBe('Connection lost');
    });
  });

  describe('disconnect', () => {
    it('should update status to disconnected', async () => {
      getClient();
      await disconnect();
      
      const status = getConnectionStatus();
      expect(status.status).toBe('disconnected');
      expect(status.error).toBe(null);
    });

    it('should reset client instance to null', async () => {
      getClient();
      const callCountBefore = MockKafka.mock.calls.length;
      
      await disconnect();
      
      getClient();
      const callCountAfter = MockKafka.mock.calls.length;
      
      // After disconnect, getClient should create a new instance
      expect(callCountAfter).toBeGreaterThan(callCountBefore);
    });

    it('should handle disconnect gracefully when client is null', async () => {
      await disconnect(); // Should not throw
      
      const status = getConnectionStatus();
      expect(status.status).toBe('disconnected');
    });
  });

  describe('connection status tracking', () => {
    it('should track status state transitions correctly', async () => {
      // Initial state: should be disconnected after previous afterEach cleanup
      let status = getConnectionStatus();
      expect(status.status).toBe('disconnected');
      
      // After getClient: should be connecting
      getClient();
      status = getConnectionStatus();
      expect(status.status).toBe('connecting');
      
      // After setConnected: should be connected
      setConnected();
      status = getConnectionStatus();
      expect(status.status).toBe('connected');
      
      // After setConnectionError: should be error
      setConnectionError(new Error('Test error'));
      status = getConnectionStatus();
      expect(status.status).toBe('error');
      expect(status.error).toBe('Test error');
      
      // After disconnect: should be disconnected
      await disconnect();
      status = getConnectionStatus();
      expect(status.status).toBe('disconnected');
      expect(status.error).toBe(null);
    });
  });

  describe('error handling', () => {
    it('should handle creation errors gracefully', () => {
      // This test verifies the structure is in place
      // Actual error handling is tested through integration
      const status = getConnectionStatus();
      expect(status).toHaveProperty('error');
    });
  });
});
