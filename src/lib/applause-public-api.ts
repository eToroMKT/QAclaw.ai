/**
 * Applause Public API v2 Client
 * Docs: https://applause.gitbook.io/applause-developer-guide
 * Swagger: https://api.applause.com/v2/swagger-ui/index.html
 */

const BASE_URL = 'https://api.applause.com/v2';

// ── Types ────────────────────────────────────────────────────────────

export interface ApplauseTestCycle {
  id: number;
  name: string;
  status: string;
  productId: number;
  buildId?: number;
  startDate?: string;
  endDate?: string;
  createDate?: string;
  type?: string;
  methodology?: string;
  timeLeft?: string;
  issueStatusCounts?: Record<string, number>;
  [key: string]: unknown;
}

export interface ApplauseIssue {
  id: number;
  subject: string;
  status: string;
  severityId?: number;
  severity?: string;
  qualityRatingId?: string;
  actionPerform?: string;
  expectedResult?: string;
  actualResult?: string;
  errorMessage?: string;
  additionalEnvironmentInfo?: string;
  testCycleId?: number;
  buildId?: number;
  createdDate?: string;
  updatedDate?: string;
  [key: string]: unknown;
}

export interface ApplauseAttachment {
  id: number;
  fileName: string;
  fileSize: number;
  downloadUrl: string;
  [key: string]: unknown;
}

export interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface CreateTestCycleDto {
  templateTestCycleId?: number;
  type?: 'FUNCTIONAL' | 'AUTOMATION';
  methodology?: 'EXPLORATORY' | 'EXPLORATORY_WITH_TEST_CASES';
  name?: string;
  buildId?: number;
  setupInstructions?: string;
  inScope?: string;
  outOfScope?: string;
  issueReportingInstructions?: string;
  specialInstructions?: string;
  [key: string]: unknown;
}

// ── Client ───────────────────────────────────────────────────────────

export class ApplausePublicApi {
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.APPLAUSE_API_KEY || '';
  }

  get isConfigured(): boolean {
    return !!this.apiKey;
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    if (!this.apiKey) {
      throw new Error('Applause API key not configured. Set APPLAUSE_API_KEY env var.');
    }

    const url = `${BASE_URL}${path}`;
    console.log(`[applause-api] ${method} ${url}`);

    const res = await fetch(url, {
      method,
      headers: {
        'X-Api-Key': this.apiKey,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Applause API ${method} ${path} failed (${res.status}): ${text.slice(0, 500)}`);
    }

    if (res.status === 204 || res.headers.get('content-length') === '0') {
      return {} as T;
    }

    return res.json();
  }

  // ── Test Cycles ──────────────────────────────────────────────────

  async listTestCycles(page = 0, size = 20): Promise<PagedResponse<ApplauseTestCycle>> {
    return this.request('GET', `/test-cycles?page=${page}&size=${size}`);
  }

  async getTestCycle(cycleId: number): Promise<ApplauseTestCycle> {
    return this.request('GET', `/test-cycles/${cycleId}`);
  }

  async createTestCycle(dto: CreateTestCycleDto): Promise<ApplauseTestCycle> {
    return this.request('POST', '/test-cycles', dto);
  }

  async updateTestCycle(cycleId: number, dto: Partial<CreateTestCycleDto>): Promise<ApplauseTestCycle> {
    return this.request('PATCH', `/test-cycles/${cycleId}`, dto);
  }

  async requestActivation(cycleId: number): Promise<void> {
    await this.request('POST', `/test-cycles/${cycleId}/request-activation`);
  }

  async activateTestCycle(cycleId: number): Promise<void> {
    await this.request('POST', `/test-cycles/${cycleId}/activate`);
  }

  // ── Bugs / Issues ────────────────────────────────────────────────

  async getTestCycleBugs(cycleId: number, page = 0, size = 50): Promise<PagedResponse<ApplauseIssue>> {
    return this.request('GET', `/test-cycles/${cycleId}/bugs?page=${page}&size=${size}`);
  }

  async getIssue(issueId: number): Promise<ApplauseIssue> {
    return this.request('GET', `/issues/${issueId}`);
  }

  async getIssueAttachments(issueId: number): Promise<ApplauseAttachment[]> {
    return this.request('GET', `/issues/${issueId}/attachments`);
  }

  // ── Progress Monitoring ──────────────────────────────────────────

  async monitorProgress(cycleId: number): Promise<ApplauseTestCycle> {
    // The cycle details endpoint includes issueStatusCounts and timeLeft
    return this.getTestCycle(cycleId);
  }
}

// ── Singleton ────────────────────────────────────────────────────────

let _client: ApplausePublicApi | null = null;

export function getApplausePublicApi(): ApplausePublicApi {
  if (!_client) {
    _client = new ApplausePublicApi();
  }
  return _client;
}
