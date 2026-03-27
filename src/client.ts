/**
 * RenderingVideo Node.js SDK - Main Client
 */

import type {
  ClientOptions,
  Task,
  TaskList,
  Credits,
  CreateVideoOptions,
  ListTasksOptions,
  RenderOptions,
  DeleteTaskResult,
  VideoConfig,
  UploadResult,
  FileList,
  UploadedFile,
  DeleteFileResult,
  ListFilesOptions,
  PreviewResult,
  PreviewConfig,
  DeletePreviewResult,
  ConvertPreviewResult,
  RenderPreviewResult,
  ConvertPreviewOptions,
  RenderPreviewOptions,
} from './types';
import { handleApiError, RenderingVideoError } from './errors';

const DEFAULT_BASE_URL = 'https://renderingvideo.com';
const DEFAULT_TIMEOUT = 30000;

/**
 * Internal request helper
 */
async function request<T>(
  baseUrl: string,
  apiKey: string,
  timeout: number,
  method: string,
  endpoint: string,
  body?: unknown,
  params?: Record<string, string | number | undefined>
): Promise<T> {
  const url = new URL(`${baseUrl}${endpoint}`);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.append(key, String(value));
      }
    });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url.toString(), {
      method,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    const data = (await response.json()) as Record<string, unknown>;

    if (!response.ok) {
      throw handleApiError(
        response.status,
        (data.error as string) || 'Unknown error',
        (data.code as string) || 'UNKNOWN_ERROR',
        (data.details as Record<string, unknown>) || data
      );
    }

    return data as unknown as T;
  } catch (error) {
    if (error instanceof RenderingVideoError) {
      throw error;
    }
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeout}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Video API Client
 */
export class VideoClient {
  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string,
    private readonly timeout: number
  ) {}

  private async request<T>(
    method: string,
    endpoint: string,
    body?: unknown,
    params?: Record<string, string | number | undefined>
  ): Promise<T> {
    return request<T>(this.baseUrl, this.apiKey, this.timeout, method, endpoint, body, params);
  }

  /**
   * Create a new video task (does not start rendering)
   * @example
   * ```typescript
   * const task = await client.video.create({
   *   config: {
   *     meta: { version: '2.0.0', width: 1920, height: 1080, fps: 30 },
   *     tracks: [{ clips: [{ type: 'text', text: 'Hello World', start: 0, duration: 5 }] }]
   *   },
   *   metadata: { projectId: 'proj_123' }
   * });
   * ```
   */
  async create(options: CreateVideoOptions): Promise<Task> {
    const body: Record<string, unknown> = { config: options.config };
    if (options.metadata) body.metadata = options.metadata;

    return this.request<Task>('POST', '/api/v1/video', body);
  }

  /**
   * List video tasks
   * @example
   * ```typescript
   * const { tasks, pagination } = await client.video.list({ page: 1, limit: 20, status: 'completed' });
   * ```
   */
  async list(options?: ListTasksOptions): Promise<TaskList> {
    return this.request<TaskList>('GET', '/api/v1/video', undefined, {
      page: options?.page,
      limit: options?.limit,
      status: options?.status,
    });
  }

  /**
   * Get task details by ID
   * @example
   * ```typescript
   * const task = await client.video.get('abc123def456');
   * console.log(task.status, task.videoUrl);
   * ```
   */
  async get(taskId: string): Promise<Task> {
    return this.request<Task>('GET', `/api/v1/video/${taskId}`);
  }

  /**
   * Delete a video task permanently
   * @example
   * ```typescript
   * const result = await client.video.delete('abc123def456');
   * console.log(result.deleted, result.remoteDeleted);
   * ```
   */
  async delete(taskId: string): Promise<DeleteTaskResult> {
    return this.request<DeleteTaskResult>('DELETE', `/api/v1/video/${taskId}`);
  }

  /**
   * Trigger rendering for a task
   * @example
   * ```typescript
   * const result = await client.video.render('abc123def456', {
   *   webhookUrl: 'https://example.com/webhook',
   *   numWorkers: 5
   * });
   * ```
   */
  async render(taskId: string, options?: RenderOptions): Promise<Task> {
    const body: Record<string, unknown> = {};
    if (options?.webhookUrl) body.webhook_url = options.webhookUrl;
    if (options?.numWorkers) body.num_workers = options.numWorkers;

    return this.request<Task>('POST', `/api/v1/video/${taskId}/render`, body);
  }

  /**
   * Create task and immediately start rendering (convenience method)
   * @example
   * ```typescript
   * const task = await client.video.createAndRender({
   *   config: { ... },
   *   webhookUrl: 'https://example.com/webhook'
   * });
   * ```
   */
  async createAndRender(options: CreateVideoOptions & RenderOptions): Promise<Task> {
    const task = await this.create(options);
    return this.render(task.taskId, { webhookUrl: options.webhookUrl, numWorkers: options.numWorkers });
  }
}

/**
 * File API Client
 */
export class FileClient {
  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string,
    private readonly timeout: number
  ) {}

  private async request<T>(
    method: string,
    endpoint: string,
    body?: unknown,
    params?: Record<string, string | number | undefined>
  ): Promise<T> {
    return request<T>(this.baseUrl, this.apiKey, this.timeout, method, endpoint, body, params);
  }

  /**
   * Upload files (images, videos, audio)
   * @example
   * ```typescript
   * // In Node.js with FormData
   * const formData = new FormData();
   * formData.append('file', fileBlob, 'image.png');
   * const result = await client.files.upload(formData);
   *
   * // Multiple files
   * formData.append('files', file1Blob, 'video.mp4');
   * formData.append('files', file2Blob, 'audio.mp3');
   * const result = await client.files.upload(formData);
   * ```
   */
  async upload(formData: FormData): Promise<UploadResult> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}/api/v1/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: formData,
        signal: controller.signal,
      });

      const data = (await response.json()) as Record<string, unknown>;

      if (!response.ok) {
        throw handleApiError(
          response.status,
          (data.error as string) || 'Unknown error',
          (data.code as string) || 'UNKNOWN_ERROR',
          (data.details as Record<string, unknown>) || data
        );
      }

      return data as unknown as UploadResult;
    } catch (error) {
      if (error instanceof RenderingVideoError) {
        throw error;
      }
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Upload timed out after ${this.timeout}ms`);
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Upload a single file from buffer (Node.js)
   * @example
   * ```typescript
   * const buffer = fs.readFileSync('./image.png');
   * const result = await client.files.uploadBuffer(buffer, 'image.png', 'image/png');
   * ```
   */
  async uploadBuffer(buffer: Buffer, filename: string, mimeType: string): Promise<UploadResult> {
    const formData = new FormData();
    const blob = new Blob([buffer], { type: mimeType });
    formData.append('file', blob, filename);
    return this.upload(formData);
  }

  /**
   * Upload a single file from Blob/File
   * @example
   * ```typescript
   * const blob = new Blob([data], { type: 'image/png' });
   * const result = await client.files.uploadFile(blob, 'image.png');
   * ```
   */
  async uploadFile(file: Blob | File, filename?: string): Promise<UploadResult> {
    const formData = new FormData();
    formData.append('file', file, filename || (file instanceof File ? file.name : 'file'));
    return this.upload(formData);
  }

  /**
   * List uploaded files
   * @example
   * ```typescript
   * const { files, pagination } = await client.files.list({ type: 'image', limit: 50 });
   * ```
   */
  async list(options?: ListFilesOptions): Promise<FileList> {
    return this.request<FileList>('GET', '/api/v1/files', undefined, {
      page: options?.page,
      limit: options?.limit,
      type: options?.type,
    });
  }

  /**
   * Delete a file
   * @example
   * ```typescript
   * const result = await client.files.delete('asset_001');
   * ```
   */
  async delete(fileId: string): Promise<DeleteFileResult> {
    return this.request<DeleteFileResult>('DELETE', `/api/v1/files/${fileId}`);
  }

  /**
   * Get file by ID (convenience method - searches through list)
   * @example
   * ```typescript
   * const file = await client.files.get('asset_001');
   * ```
   */
  async get(fileId: string): Promise<UploadedFile | null> {
    const { files } = await this.list({ limit: 100 });
    return files.find(f => f.id === fileId) || null;
  }
}

/**
 * Preview API Client
 */
export class PreviewClient {
  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string,
    private readonly timeout: number
  ) {}

  private async request<T>(
    method: string,
    endpoint: string,
    body?: unknown,
    params?: Record<string, string | number | undefined>
  ): Promise<T> {
    return request<T>(this.baseUrl, this.apiKey, this.timeout, method, endpoint, body, params);
  }

  /**
   * Create a temporary preview link (7 days validity, no credits consumed)
   * @example
   * ```typescript
   * const preview = await client.preview.create({
   *   meta: { version: '2.0.0', width: 1920, height: 1080 },
   *   tracks: [{ clips: [{ type: 'text', text: 'Preview', start: 0, duration: 5 }] }]
   * });
   * console.log(preview.previewUrl, preview.tempId);
   * ```
   */
  async create(config: VideoConfig): Promise<PreviewResult> {
    return this.request<PreviewResult>('POST', '/api/v1/preview', { config });
  }

  /**
   * Get preview configuration
   * @example
   * ```typescript
   * const { config } = await client.preview.get('temp_abc123');
   * ```
   */
  async get(tempId: string): Promise<PreviewConfig> {
    return this.request<PreviewConfig>('GET', `/api/v1/preview/${tempId}`);
  }

  /**
   * Delete a preview link
   * @example
   * ```typescript
   * const result = await client.preview.delete('temp_abc123');
   * ```
   */
  async delete(tempId: string): Promise<DeletePreviewResult> {
    return this.request<DeletePreviewResult>('DELETE', `/api/v1/preview/${tempId}`);
  }

  /**
   * Convert preview to permanent task (does not start rendering)
   * @example
   * ```typescript
   * const result = await client.preview.convert('temp_abc123', { category: 'marketing' });
   * console.log(result.taskId);
   * ```
   */
  async convert(tempId: string, options?: ConvertPreviewOptions): Promise<ConvertPreviewResult> {
    const body: Record<string, unknown> = {};
    if (options?.category) body.category = options.category;

    return this.request<ConvertPreviewResult>('POST', `/api/v1/preview/${tempId}/convert`, body);
  }

  /**
   * Convert preview to permanent task and immediately start rendering
   * @example
   * ```typescript
   * const result = await client.preview.render('temp_abc123', {
   *   webhookUrl: 'https://example.com/webhook'
   * });
   * console.log(result.taskId, result.status);
   * ```
   */
  async render(tempId: string, options?: RenderPreviewOptions): Promise<RenderPreviewResult> {
    const body: Record<string, unknown> = {};
    if (options?.category) body.category = options.category;
    if (options?.webhookUrl) body.webhook_url = options.webhookUrl;
    if (options?.numWorkers) body.num_workers = options.numWorkers;

    return this.request<RenderPreviewResult>('POST', `/api/v1/preview/${tempId}/render`, body);
  }
}

/**
 * Main RenderingVideo SDK Client
 *
 * @example
 * ```typescript
 * import { RenderingVideo } from '@renderingvideo/sdk';
 *
 * const client = new RenderingVideo({ apiKey: 'sk-xxx' });
 *
 * // Create and render a video
 * const task = await client.video.create({ config: { ... } });
 * await client.video.render(task.taskId);
 *
 * // Check credits
 * const { credits } = await client.credits.get();
 *
 * // Upload files
 * const { assets } = await client.files.uploadFile(imageBlob);
 * ```
 */
export class RenderingVideo {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeout: number;

  private _video: VideoClient | null = null;
  private _files: FileClient | null = null;
  private _preview: PreviewClient | null = null;

  constructor(options: ClientOptions);
  constructor(apiKey: string, options?: Partial<Omit<ClientOptions, 'apiKey'>>);
  constructor(apiKeyOrOptions: string | ClientOptions, options?: Partial<Omit<ClientOptions, 'apiKey'>>) {
    if (typeof apiKeyOrOptions === 'string') {
      this.apiKey = apiKeyOrOptions;
      this.baseUrl = options?.baseUrl ?? DEFAULT_BASE_URL;
      this.timeout = options?.timeout ?? DEFAULT_TIMEOUT;
    } else {
      this.apiKey = apiKeyOrOptions.apiKey;
      this.baseUrl = apiKeyOrOptions.baseUrl ?? DEFAULT_BASE_URL;
      this.timeout = apiKeyOrOptions.timeout ?? DEFAULT_TIMEOUT;
    }

    if (!this.apiKey) {
      throw new Error('API key is required');
    }

    if (!this.apiKey.startsWith('sk-')) {
      throw new Error('Invalid API key. API key should start with "sk-"');
    }
  }

  /**
   * Video API operations
   */
  get video(): VideoClient {
    if (!this._video) {
      this._video = new VideoClient(this.baseUrl, this.apiKey, this.timeout);
    }
    return this._video;
  }

  /**
   * File API operations (upload, list, delete)
   */
  get files(): FileClient {
    if (!this._files) {
      this._files = new FileClient(this.baseUrl, this.apiKey, this.timeout);
    }
    return this._files;
  }

  /**
   * Preview API operations
   */
  get preview(): PreviewClient {
    if (!this._preview) {
      this._preview = new PreviewClient(this.baseUrl, this.apiKey, this.timeout);
    }
    return this._preview;
  }

  /**
   * Credits API operations
   */
  get credits(): CreditsClient {
    return new CreditsClient(this.baseUrl, this.apiKey, this.timeout);
  }

  /**
   * Get masked API key for logging
   */
  get apiKeyPreview(): string {
    return this.apiKey.length > 12
      ? `${this.apiKey.slice(0, 8)}...${this.apiKey.slice(-4)}`
      : '***';
  }

  /**
   * Get the base URL being used
   */
  get baseURL(): string {
    return this.baseUrl;
  }
}

/**
 * Credits API Client
 */
export class CreditsClient {
  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string,
    private readonly timeout: number
  ) {}

  /**
   * Get current credit balance
   * @example
   * ```typescript
   * const { credits } = await client.credits.get();
   * console.log(`You have ${credits} credits remaining`);
   * ```
   */
  async get(): Promise<Credits> {
    return request<Credits>(this.baseUrl, this.apiKey, this.timeout, 'GET', '/api/v1/credits');
  }

  /**
   * Check if user has enough credits for a render
   * @example
   * ```typescript
   * const hasCredits = await client.credits.hasEnough(100);
   * ```
   */
  async hasEnough(required: number): Promise<boolean> {
    const { credits } = await this.get();
    return credits >= required;
  }
}

export default RenderingVideo;
