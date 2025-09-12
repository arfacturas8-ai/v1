import crypto from 'crypto';

export interface TestUser {
  email: string;
  username: string;
  password: string;
  displayName?: string;
}

export interface TestChannel {
  id: string;
  name: string;
  description?: string;
}

export interface TestCommunity {
  id: string;
  name: string;
  description?: string;
}

/**
 * Generate a unique test user
 */
export function generateTestUser(suffix?: string): TestUser {
  const timestamp = Date.now();
  const randomSuffix = crypto.randomBytes(4).toString('hex');
  const uniqueSuffix = suffix || randomSuffix;
  
  return {
    email: `test-${uniqueSuffix}-${timestamp}@example.com`,
    username: `testuser${uniqueSuffix}${timestamp}`.substring(0, 20), // Limit username length
    password: 'TestPassword123!',
    displayName: `Test User ${uniqueSuffix}`,
  };
}

/**
 * Generate a test channel
 */
export function createTestChannel(name?: string): TestChannel {
  const timestamp = Date.now();
  const randomSuffix = crypto.randomBytes(4).toString('hex');
  
  return {
    id: `test-channel-${timestamp}-${randomSuffix}`,
    name: name || `test-channel-${randomSuffix}`,
    description: 'Test channel for automated testing',
  };
}

/**
 * Generate a test community/server
 */
export function createTestCommunity(name?: string): TestCommunity {
  const timestamp = Date.now();
  const randomSuffix = crypto.randomBytes(4).toString('hex');
  
  return {
    id: `test-community-${timestamp}-${randomSuffix}`,
    name: name || `Test Server ${randomSuffix}`,
    description: 'Test community for automated testing',
  };
}

/**
 * Cleanup test user data
 */
export async function cleanupTestUser(email: string): Promise<void> {
  try {
    // In a real implementation, this would make API calls to clean up test data
    // For now, we'll just log the cleanup attempt
    console.log(`Cleaning up test user: ${email}`);
    
    // Example API call:
    // await fetch('/api/test/cleanup-user', {
    //   method: 'DELETE',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ email })
    // });
  } catch (error) {
    console.warn(`Failed to cleanup test user ${email}:`, error);
  }
}

/**
 * Cleanup test channel data
 */
export async function cleanupTestChannel(channelId: string): Promise<void> {
  try {
    console.log(`Cleaning up test channel: ${channelId}`);
    // Implementation would clean up channel data
  } catch (error) {
    console.warn(`Failed to cleanup test channel ${channelId}:`, error);
  }
}

/**
 * Cleanup test community data
 */
export async function cleanupTestCommunity(communityId: string): Promise<void> {
  try {
    console.log(`Cleaning up test community: ${communityId}`);
    // Implementation would clean up community data
  } catch (error) {
    console.warn(`Failed to cleanup test community ${communityId}:`, error);
  }
}

/**
 * Wait for element to be stable (not moving/changing)
 */
export async function waitForStable(page: any, selector: string, timeout = 5000): Promise<void> {
  const element = page.locator(selector);
  await element.waitFor({ state: 'visible', timeout });
  
  // Wait for element to be stable (no animations/changes)
  let lastBounds = await element.boundingBox();
  let stableCount = 0;
  
  while (stableCount < 5) { // Check stability 5 times
    await page.waitForTimeout(100);
    const currentBounds = await element.boundingBox();
    
    if (JSON.stringify(lastBounds) === JSON.stringify(currentBounds)) {
      stableCount++;
    } else {
      stableCount = 0;
      lastBounds = currentBounds;
    }
  }
}

/**
 * Generate random message content
 */
export function generateRandomMessage(length = 50): string {
  const words = [
    'hello', 'world', 'test', 'message', 'chat', 'user', 'awesome', 'great',
    'fantastic', 'amazing', 'wonderful', 'excellent', 'perfect', 'brilliant',
    'outstanding', 'remarkable', 'incredible', 'magnificent', 'spectacular',
  ];
  
  const messageWords = [];
  while (messageWords.join(' ').length < length) {
    const word = words[Math.floor(Math.random() * words.length)];
    messageWords.push(word);
  }
  
  return messageWords.join(' ');
}

/**
 * Wait for WebSocket connection to be established
 */
export async function waitForWebSocketConnection(page: any, timeout = 10000): Promise<void> {
  // Wait for connection indicator or specific elements that show connection
  await page.waitForFunction(
    () => {
      // Check if WebSocket is connected (implementation specific)
      return window.socket?.connected === true;
    },
    { timeout }
  );
}

/**
 * Simulate network latency
 */
export async function simulateNetworkLatency(page: any, latencyMs = 100): Promise<void> {
  await page.route('**/*', async (route) => {
    await new Promise(resolve => setTimeout(resolve, latencyMs));
    await route.continue();
  });
}

/**
 * Create test fixture files
 */
export function createTestFile(filename: string, content: string): string {
  const fs = require('fs');
  const path = require('path');
  
  const fixturesDir = path.join(__dirname, '..', 'fixtures');
  if (!fs.existsSync(fixturesDir)) {
    fs.mkdirSync(fixturesDir, { recursive: true });
  }
  
  const filePath = path.join(fixturesDir, filename);
  fs.writeFileSync(filePath, content);
  
  return filePath;
}

/**
 * Generate test image file
 */
export function createTestImage(): string {
  // Create a minimal PNG file (1x1 transparent pixel)
  const pngData = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
    0x00, 0x00, 0x00, 0x0D, // IHDR chunk length
    0x49, 0x48, 0x44, 0x52, // IHDR
    0x00, 0x00, 0x00, 0x01, // Width: 1
    0x00, 0x00, 0x00, 0x01, // Height: 1
    0x08, 0x06, 0x00, 0x00, 0x00, // Bit depth, color type, compression, filter, interlace
    0x1F, 0x15, 0xC4, 0x89, // CRC
    0x00, 0x00, 0x00, 0x0A, // IDAT chunk length
    0x49, 0x44, 0x41, 0x54, // IDAT
    0x78, 0x9C, 0x62, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, // Compressed data
    0xE2, 0x21, 0xBC, 0x33, // CRC
    0x00, 0x00, 0x00, 0x00, // IEND chunk length
    0x49, 0x45, 0x4E, 0x44, // IEND
    0xAE, 0x42, 0x60, 0x82  // CRC
  ]);
  
  return createTestFile('test-image.png', pngData.toString('binary'));
}

/**
 * Generate stress test data
 */
export function generateStressTestData(count: number): Array<{ content: string; timestamp: number }> {
  const messages = [];
  
  for (let i = 0; i < count; i++) {
    messages.push({
      content: `Stress test message ${i + 1} - ${generateRandomMessage(20)}`,
      timestamp: Date.now() + i,
    });
  }
  
  return messages;
}

/**
 * Validate message order in DOM
 */
export async function validateMessageOrder(page: any, messages: string[]): Promise<boolean> {
  const messageElements = await page.locator('[data-testid="message"]').all();
  const actualMessages = await Promise.all(
    messageElements.map(el => el.locator('[data-testid="message-content"]').textContent())
  );
  
  // Find the positions of our test messages
  const testMessagePositions = messages.map(msg => 
    actualMessages.findIndex(actual => actual?.includes(msg))
  );
  
  // Check if positions are in ascending order
  for (let i = 1; i < testMessagePositions.length; i++) {
    if (testMessagePositions[i] <= testMessagePositions[i - 1]) {
      console.error('Message order validation failed:', {
        expected: messages,
        actual: actualMessages,
        positions: testMessagePositions,
      });
      return false;
    }
  }
  
  return true;
}

/**
 * Mock WebSocket for testing
 */
export async function mockWebSocket(page: any): Promise<void> {
  await page.addInitScript(() => {
    class MockWebSocket {
      readyState = 1; // OPEN
      onopen: ((event: Event) => void) | null = null;
      onmessage: ((event: MessageEvent) => void) | null = null;
      onclose: ((event: CloseEvent) => void) | null = null;
      onerror: ((event: Event) => void) | null = null;
      
      constructor(url: string) {
        console.log('Mock WebSocket created:', url);
        setTimeout(() => {
          if (this.onopen) {
            this.onopen(new Event('open'));
          }
        }, 100);
      }
      
      send(data: string) {
        console.log('Mock WebSocket send:', data);
        // Echo back for testing
        setTimeout(() => {
          if (this.onmessage) {
            this.onmessage(new MessageEvent('message', { data }));
          }
        }, 50);
      }
      
      close() {
        console.log('Mock WebSocket closed');
        if (this.onclose) {
          this.onclose(new CloseEvent('close'));
        }
      }
    }
    
    (window as any).WebSocket = MockWebSocket;
  });
}

/**
 * Performance measurement utilities
 */
export class PerformanceMeasurement {
  private startTime: number;
  private measurements: Array<{ name: string; duration: number }> = [];
  
  constructor() {
    this.startTime = Date.now();
  }
  
  mark(name: string): void {
    const now = Date.now();
    this.measurements.push({
      name,
      duration: now - this.startTime,
    });
  }
  
  getResults(): Array<{ name: string; duration: number }> {
    return [...this.measurements];
  }
  
  getDuration(name: string): number | undefined {
    const measurement = this.measurements.find(m => m.name === name);
    return measurement?.duration;
  }
  
  reset(): void {
    this.startTime = Date.now();
    this.measurements = [];
  }
}

/**
 * Error boundary for test reliability
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  fallback: T,
  errorMessage = 'Operation failed'
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    console.warn(`${errorMessage}:`, error);
    return fallback;
  }
}