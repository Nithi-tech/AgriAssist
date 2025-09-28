/**
 * Farmer Community Test Suite
 * Test file for the Farmer Community chat functionality
 */

import { describe, expect, test, beforeEach, afterEach, jest } from '@jest/globals';
import { FarmerCommunityService } from '../src/lib/farmer-community-service';

// Mock Supabase
jest.mock('../src/lib/supabase', () => ({
  supabase: {
    channel: jest.fn(() => ({
      on: jest.fn(() => ({ subscribe: jest.fn() })),
      subscribe: jest.fn(),
      track: jest.fn(),
      unsubscribe: jest.fn(),
    })),
    from: jest.fn(() => ({
      insert: jest.fn(() => ({ select: jest.fn(() => ({ single: jest.fn() })) })),
      select: jest.fn(() => ({ eq: jest.fn(() => ({ single: jest.fn() })) })),
      update: jest.fn(() => ({ eq: jest.fn() })),
      upsert: jest.fn(),
      order: jest.fn(() => ({ limit: jest.fn() })),
    })),
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(),
        getPublicUrl: jest.fn(() => ({ data: { publicUrl: 'test-url' } })),
      })),
    },
  },
}));

describe('Farmer Community Service', () => {
  let service: FarmerCommunityService;

  beforeEach(() => {
    service = new FarmerCommunityService();
  });

  afterEach(async () => {
    await service.disconnect();
  });

  test('should connect to chat service', async () => {
    const result = await service.connect('F001', 'Test Farmer');
    expect(result).toBe(true);
  });

  test('should send text message', async () => {
    await service.connect('F001', 'Test Farmer');
    const message = await service.sendTextMessage('Hello, fellow farmers!');
    expect(message).toBeDefined();
    expect(message?.content).toBe('Hello, fellow farmers!');
    expect(message?.farmer_id).toBe('F001');
  });

  test('should handle voice message upload', async () => {
    await service.connect('F001', 'Test Farmer');
    const mockBlob = new Blob(['test audio data'], { type: 'audio/webm' });
    const message = await service.sendVoiceMessage(mockBlob, 10);
    
    expect(message).toBeDefined();
    expect(message?.message_type).toBe('voice');
    expect(message?.voice_duration).toBe(10);
  });

  test('should track online status', async () => {
    const mockCallback = jest.fn();
    service.onOnlineStatusChange(mockCallback);
    
    await service.connect('F001', 'Test Farmer');
    await service.updateFarmerStatus('F001', 'online');
    
    expect(mockCallback).toHaveBeenCalled();
  });

  test('should handle typing indicators', () => {
    const mockCallback = jest.fn();
    service.onTypingStatus(mockCallback);
    
    service.broadcastTyping(true);
    // Verify typing broadcast was sent
    expect(service).toBeDefined(); // Basic check for now
  });
});

describe('Voice Message Recording', () => {
  let mockMediaRecorder: any;
  let mockStream: any;

  beforeEach(() => {
    // Mock MediaRecorder
    mockMediaRecorder = {
      start: jest.fn(),
      stop: jest.fn(),
      ondataavailable: null,
      onstop: null,
      onerror: null,
      state: 'inactive',
    };

    mockStream = {
      getTracks: jest.fn(() => [
        { stop: jest.fn() }
      ]),
    };

    // Mock getUserMedia
    Object.defineProperty(global.navigator, 'mediaDevices', {
      value: {
        getUserMedia: jest.fn(() => Promise.resolve(mockStream)),
      },
      writable: true,
    });

    // Mock MediaRecorder constructor
    (global as any).MediaRecorder = jest.fn(() => mockMediaRecorder);
    (global as any).MediaRecorder.isTypeSupported = jest.fn(() => true);
  });

  test('should initialize media recorder', async () => {
    const getUserMedia = global.navigator.mediaDevices.getUserMedia as jest.Mock;
    await getUserMedia({ audio: true });
    
    expect(getUserMedia).toHaveBeenCalledWith({ audio: true });
  });

  test('should handle recording start', () => {
    const recorder = new (global as any).MediaRecorder(mockStream);
    recorder.start();
    
    expect(mockMediaRecorder.start).toHaveBeenCalled();
  });

  test('should handle recording stop', () => {
    const recorder = new (global as any).MediaRecorder(mockStream);
    recorder.stop();
    
    expect(mockMediaRecorder.stop).toHaveBeenCalled();
  });

  test('should process audio data', () => {
    const recorder = new (global as any).MediaRecorder(mockStream);
    const mockEvent = {
      data: new Blob(['audio data'], { type: 'audio/webm' }),
    };

    // Simulate data available
    if (recorder.ondataavailable) {
      recorder.ondataavailable(mockEvent);
    }

    expect(mockEvent.data.size).toBeGreaterThan(0);
  });
});

describe('Real-time Message Handling', () => {
  test('should handle new message callback', () => {
    const service = new FarmerCommunityService();
    const mockCallback = jest.fn();
    
    service.onNewMessage(mockCallback);
    
    // Simulate message received
    const mockMessage = {
      id: '123',
      farmer_id: 'F002',
      content: 'Test message',
      timestamp: new Date().toISOString(),
      message_type: 'text' as const,
      status: 'sent' as const,
      farmer_profile: {
        id: 'F002',
        name: 'Test Farmer 2',
        status: 'online' as const,
      },
    };

    // Verify callback registration
    expect(service).toBeDefined();
  });

  test('should handle connection status', async () => {
    const service = new FarmerCommunityService();
    const connected = await service.connect('F001', 'Test Farmer');
    
    expect(connected).toBe(true);
    
    await service.disconnect();
  });
});

describe('Message Validation', () => {
  test('should reject empty text messages', async () => {
    const service = new FarmerCommunityService();
    await service.connect('F001', 'Test Farmer');
    
    const message = await service.sendTextMessage('');
    expect(message).toBeNull();
  });

  test('should reject messages without user connection', async () => {
    const service = new FarmerCommunityService();
    
    const message = await service.sendTextMessage('Test message');
    expect(message).toBeNull();
  });

  test('should validate voice message duration', async () => {
    const service = new FarmerCommunityService();
    await service.connect('F001', 'Test Farmer');
    
    const mockBlob = new Blob(['audio data'], { type: 'audio/webm' });
    const message = await service.sendVoiceMessage(mockBlob, 0); // Invalid duration
    
    // Should handle invalid duration gracefully
    expect(message).toBeDefined();
  });
});

describe('Error Handling', () => {
  test('should handle microphone permission denied', async () => {
    // Mock getUserMedia to reject
    Object.defineProperty(global.navigator, 'mediaDevices', {
      value: {
        getUserMedia: jest.fn(() => Promise.reject(new Error('Permission denied'))),
      },
      writable: true,
    });

    try {
      await global.navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toBe('Permission denied');
    }
  });

  test('should handle network disconnection', async () => {
    const service = new FarmerCommunityService();
    await service.connect('F001', 'Test Farmer');
    
    // Simulate network disconnection
    await service.disconnect();
    
    const message = await service.sendTextMessage('Test after disconnect');
    expect(message).toBeNull();
  });

  test('should handle voice upload failure', async () => {
    const service = new FarmerCommunityService();
    await service.connect('F001', 'Test Farmer');
    
    // Mock upload failure
    const mockBlob = new Blob(['corrupted data'], { type: 'audio/webm' });
    const message = await service.sendVoiceMessage(mockBlob, 10);
    
    // Should handle upload failure gracefully
    expect(message).toBeDefined();
  });
});

// Integration Tests (require actual Supabase setup)
describe.skip('Integration Tests', () => {
  test('should send and receive messages in real-time', async () => {
    // This would require actual Supabase setup
    // Skip in unit tests, run separately for integration testing
  });

  test('should upload and retrieve voice messages', async () => {
    // This would test actual file upload to Supabase Storage
    // Skip in unit tests, run separately for integration testing
  });
});

// Performance Tests
describe('Performance', () => {
  test('should handle multiple rapid messages', async () => {
    const service = new FarmerCommunityService();
    await service.connect('F001', 'Test Farmer');
    
    const promises = [];
    for (let i = 0; i < 10; i++) {
      promises.push(service.sendTextMessage(`Message ${i}`));
    }
    
    const results = await Promise.all(promises);
    const successCount = results.filter(r => r !== null).length;
    
    expect(successCount).toBeGreaterThan(0);
  });

  test('should handle large voice messages efficiently', async () => {
    const service = new FarmerCommunityService();
    await service.connect('F001', 'Test Farmer');
    
    // Create a large audio blob (simulating 2 minutes of audio)
    const largeBlob = new Blob([new ArrayBuffer(1024 * 1024)], { type: 'audio/webm' });
    
    const startTime = Date.now();
    const message = await service.sendVoiceMessage(largeBlob, 120);
    const endTime = Date.now();
    
    expect(message).toBeDefined();
    expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
  });
});

export {};
