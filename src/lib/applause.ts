/**
 * CrowdTesting Automation API Client
 * Based on CrowdTestingOSS/common-python-reporter SDK
 * Endpoints: prod-auto-api.cloud.applause.com
 */

const DEFAULT_AUTO_API_URL = 'https://prod-auto-api.cloud.applause.com:443/';
const DEFAULT_PUBLIC_API_URL = 'https://prod-public-api.cloud.applause.com:443/';

export interface CrowdTestingConfig {
  apiKey: string;
  productId: number;
  autoApiBaseUrl?: string;
  publicApiBaseUrl?: string;
  testCycleId?: number;
}

export type TestResultStatus = 'NOT_RUN' | 'IN_PROGRESS' | 'PASSED' | 'FAILED' | 'SKIPPED' | 'CANCELED' | 'ERROR';

export type AssetType = 'SCREENSHOT' | 'FAILURE_SCREENSHOT' | 'VIDEO' | 'NETWORK_HAR' | 'CONSOLE_LOG' | 'BROWSER_LOG' | 'FRAMEWORK_LOG' | 'UNKNOWN';

export class CrowdTestingClient {
  private config: CrowdTestingConfig | null = null;

  constructor(config?: CrowdTestingConfig) {
    if (config) this.config = config;
  }

  get isConfigured(): boolean { return this.config !== null; }

  private get autoApiUrl(): string {
    return this.config?.autoApiBaseUrl || DEFAULT_AUTO_API_URL;
  }

  private async request(method: string, path: string, body?: any) {
    if (!this.config) throw new Error('CrowdTesting not configured. Add API key in Settings.');

    const res = await fetch(`${this.autoApiUrl}${path}`, {
      method,
      headers: {
        'X-Api-Key': this.config.apiKey,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(`CrowdTesting API error (${res.status}): ${error}`);
    }

    if (method === 'DELETE') return null;
    return res.json();
  }

  async startTestRun(tests: string[]): Promise<{ runId: number }> {
    if (!this.config) throw new Error('CrowdTesting not configured. Add API key in Settings.');
    return this.request('POST', 'api/v1.0/test-run/create', {
      tests,
      productId: this.config!.productId,
      sdkVersion: 'clawqa:1.0.0',
      itwTestCycleId: this.config!.testCycleId || null,
    });
  }

  async endTestRun(testRunId: number): Promise<void> {
    await this.request('DELETE', `api/v1.0/test-run/${testRunId}?endingStatus=COMPLETE`);
  }

  async startTestCase(testRunId: number, testCaseName: string): Promise<{ testResultId: number }> {
    return this.request('POST', 'api/v1.0/test-result/create-result', {
      testRunId,
      testCaseName,
      providerSessionIds: [],
    });
  }

  async submitTestCaseResult(testResultId: number, status: TestResultStatus, failureReason?: string): Promise<void> {
    await this.request('POST', 'api/v1.0/test-result', {
      testResultId,
      status,
      providerSessionGuids: [],
      failureReason: failureReason || null,
    });
  }

  async uploadAsset(resultId: number, file: Uint8Array, assetName: string, assetType: AssetType = 'SCREENSHOT'): Promise<void> {
    if (!this.config) throw new Error('CrowdTesting not configured.');

    const formData = new FormData();
    formData.append('file', new Blob([file as BlobPart]), assetName);
    formData.append('assetType', assetType);
    formData.append('assetName', assetName);
    formData.append('sessionId', '');

    const res = await fetch(`${this.autoApiUrl}api/v1.0/test-result/${resultId}/upload`, {
      method: 'POST',
      headers: { 'X-Api-Key': this.config.apiKey },
      body: formData,
    });

    if (!res.ok) throw new Error(`Asset upload failed: ${res.status}`);
  }

  async sendHeartbeat(testRunId: number): Promise<void> {
    await this.request('POST', 'api/v2.0/sdk-heartbeat', { testRunId });
  }
}

let _client: CrowdTestingClient | null = null;
export function getCrowdTestingClient(): CrowdTestingClient {
  if (!_client) {
    const apiKey = process.env.APPLAUSE_API_KEY;
    const productId = process.env.APPLAUSE_PRODUCT_ID;
    const autoApiUrl = process.env.APPLAUSE_AUTO_API_URL;
    const publicApiUrl = process.env.APPLAUSE_PUBLIC_API_URL;

    if (apiKey && productId) {
      _client = new CrowdTestingClient({
        apiKey,
        productId: parseInt(productId, 10),
        autoApiBaseUrl: autoApiUrl || undefined,
        publicApiBaseUrl: publicApiUrl || undefined,
      });
    } else {
      _client = new CrowdTestingClient();
    }
  }
  return _client;
}
