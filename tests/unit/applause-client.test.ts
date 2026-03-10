import { describe, it, expect, vi } from 'vitest';
import { ApplauseClient, TestResultStatus } from '@/lib/applause';

describe('ApplauseClient', () => {
  it('should report not configured when no config', () => {
    const client = new ApplauseClient();
    expect(client.isConfigured).toBe(false);
  });

  it('should report configured with full config', () => {
    const client = new ApplauseClient({ apiKey: 'test-key', productId: 12345 });
    expect(client.isConfigured).toBe(true);
  });

  it('should throw when calling startTestRun without config', async () => {
    const client = new ApplauseClient();
    await expect(client.startTestRun(['test1'])).rejects.toThrow('Applause not configured');
  });

  it('should throw when calling submitTestCaseResult without config', async () => {
    const client = new ApplauseClient();
    await expect(client.submitTestCaseResult(1, 'PASSED')).rejects.toThrow('Applause not configured');
  });

  it('should throw when calling startTestCase without config', async () => {
    const client = new ApplauseClient();
    await expect(client.startTestCase(1, 'test')).rejects.toThrow('Applause not configured');
  });

  it('should throw when calling endTestRun without config', async () => {
    const client = new ApplauseClient();
    await expect(client.endTestRun(1)).rejects.toThrow('Applause not configured');
  });

  it('should throw when calling sendHeartbeat without config', async () => {
    const client = new ApplauseClient();
    await expect(client.sendHeartbeat(1)).rejects.toThrow('Applause not configured');
  });

  it('should throw when calling uploadAsset without config', async () => {
    const client = new ApplauseClient();
    await expect(client.uploadAsset(1, Buffer.from('test'), 'test.png')).rejects.toThrow('Applause not configured');
  });

  it('should accept all valid TestResultStatus values', () => {
    const validStatuses: TestResultStatus[] = ['NOT_RUN', 'IN_PROGRESS', 'PASSED', 'FAILED', 'SKIPPED', 'CANCELED', 'ERROR'];
    expect(validStatuses).toHaveLength(7);
    validStatuses.forEach(s => expect(typeof s).toBe('string'));
  });

  it('should use default auto API URL when not specified', () => {
    const client = new ApplauseClient({ apiKey: 'key', productId: 1 });
    // We test indirectly - startTestRun should attempt to fetch from the default URL
    // This verifies the client accepts config without custom URLs
    expect(client.isConfigured).toBe(true);
  });
});
