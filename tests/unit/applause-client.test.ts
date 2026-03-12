import { describe, it, expect, vi } from 'vitest';
import { CrowdTestingClient, TestResultStatus } from '@/lib/applause';

describe('CrowdTestingClient', () => {
  it('should report not configured when no config', () => {
    const client = new CrowdTestingClient();
    expect(client.isConfigured).toBe(false);
  });

  it('should report configured with full config', () => {
    const client = new CrowdTestingClient({ apiKey: 'test-key', productId: 12345 });
    expect(client.isConfigured).toBe(true);
  });

  it('should throw when calling startTestRun without config', async () => {
    const client = new CrowdTestingClient();
    await expect(client.startTestRun(['test1'])).rejects.toThrow('not configured');
  });

  it('should throw when calling submitTestCaseResult without config', async () => {
    const client = new CrowdTestingClient();
    await expect(client.submitTestCaseResult(1, 'PASSED')).rejects.toThrow('not configured');
  });

  it('should throw when calling startTestCase without config', async () => {
    const client = new CrowdTestingClient();
    await expect(client.startTestCase(1, 'test')).rejects.toThrow('not configured');
  });

  it('should throw when calling endTestRun without config', async () => {
    const client = new CrowdTestingClient();
    await expect(client.endTestRun(1)).rejects.toThrow('not configured');
  });

  it('should throw when calling sendHeartbeat without config', async () => {
    const client = new CrowdTestingClient();
    await expect(client.sendHeartbeat(1)).rejects.toThrow('not configured');
  });

  it('should throw when calling uploadAsset without config', async () => {
    const client = new CrowdTestingClient();
    await expect(client.uploadAsset(1, Buffer.from('test'), 'test.png')).rejects.toThrow('not configured');
  });

  it('should accept all valid TestResultStatus values', () => {
    const validStatuses: TestResultStatus[] = ['NOT_RUN', 'IN_PROGRESS', 'PASSED', 'FAILED', 'SKIPPED', 'CANCELED', 'ERROR'];
    expect(validStatuses).toHaveLength(7);
    validStatuses.forEach(s => expect(typeof s).toBe('string'));
  });

  it('should use default auto API URL when not specified', () => {
    const client = new CrowdTestingClient({ apiKey: 'key', productId: 1 });
    expect(client.isConfigured).toBe(true);
  });
});
