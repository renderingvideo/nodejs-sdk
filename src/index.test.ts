import { describe, it, expect, vi } from 'vitest';
import {
  RenderingVideo,
  VideoClient,
  FileClient,
  PreviewClient,
  CreditsClient,
  RenderingVideoError,
  AuthenticationError,
  InvalidApiKeyError,
  InsufficientCreditsError,
  ValidationError,
  NotFoundError,
  AlreadyRenderingError,
} from './index';

describe('RenderingVideo SDK', () => {
  describe('Client Initialization', () => {
    it('should initialize with options object', () => {
      const client = new RenderingVideo({ apiKey: 'sk-test-key' });
      expect(client).toBeDefined();
      expect(client.video).toBeInstanceOf(VideoClient);
      expect(client.files).toBeInstanceOf(FileClient);
      expect(client.preview).toBeInstanceOf(PreviewClient);
    });

    it('should initialize with string apiKey', () => {
      const client = new RenderingVideo('sk-test-key');
      expect(client).toBeDefined();
    });

    it('should throw error for invalid API key format', () => {
      expect(() => new RenderingVideo({ apiKey: 'invalid-key' })).toThrow(InvalidApiKeyError);
    });

    it('should throw error for missing API key', () => {
      expect(() => new RenderingVideo({ apiKey: '' })).toThrow('API key is required');
    });

    it('should mask API key in preview', () => {
      const client = new RenderingVideo({ apiKey: 'sk-test-key-12345' });
      expect(client.apiKeyPreview).toBe('sk-test-...2345');
    });

    it('should accept custom baseUrl and timeout', () => {
      const client = new RenderingVideo({
        apiKey: 'sk-test-key',
        baseUrl: 'https://custom.api.com',
        timeout: 60000,
      });
      expect(client.baseURL).toBe('https://custom.api.com');
    });
  });

  describe('Error Classes', () => {
    it('should create RenderingVideoError with code and details', () => {
      const error = new RenderingVideoError('Test error', 'TEST_CODE', { foo: 'bar' });
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_CODE');
      expect(error.details).toEqual({ foo: 'bar' });
    });

    it('should create AuthenticationError', () => {
      const error = new AuthenticationError('Invalid key', { status: 401 });
      expect(error).toBeInstanceOf(RenderingVideoError);
      expect(error.code).toBe('AUTHENTICATION_ERROR');
    });

    it('should create InsufficientCreditsError', () => {
      const error = new InsufficientCreditsError('Not enough credits');
      expect(error).toBeInstanceOf(RenderingVideoError);
      expect(error.code).toBe('INSUFFICIENT_CREDITS');
    });

    it('should create ValidationError', () => {
      const error = new ValidationError('Invalid config');
      expect(error).toBeInstanceOf(RenderingVideoError);
      expect(error.code).toBe('VALIDATION_ERROR');
    });

    it('should create NotFoundError', () => {
      const error = new NotFoundError('Task not found');
      expect(error).toBeInstanceOf(RenderingVideoError);
      expect(error.code).toBe('NOT_FOUND');
    });

    it('should create AlreadyRenderingError', () => {
      const error = new AlreadyRenderingError('Task is already rendering');
      expect(error).toBeInstanceOf(RenderingVideoError);
      expect(error.code).toBe('ALREADY_RENDERING');
    });
  });

  describe('Preview Client', () => {
    it('should send the full schema directly when creating a preview', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          tempId: 'temp_abc123',
          previewUrl: 'https://video.renderingvideo.com/t/temp_abc123',
          expiresIn: '7d',
        }),
      });

      vi.stubGlobal('fetch', fetchMock);

      const client = new RenderingVideo({
        apiKey: 'sk-test-key',
        baseUrl: 'https://api.example.com',
      });
      const config = {
        meta: { version: '2.0.0', width: 1920, height: 1080 },
        tracks: [{ clips: [{ type: 'text', text: 'Preview', start: 0, duration: 5 }] }],
      };

      try {
        await client.preview.create(config);

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock).toHaveBeenCalledWith(
          'https://api.example.com/api/v1/preview',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify(config),
          })
        );
      } finally {
        vi.unstubAllGlobals();
      }
    });
  });

  describe('File Client', () => {
    it('should search across pages when getting a file by id', async () => {
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            files: [
              { id: 'asset_001', name: 'one.png', url: 'https://example.com/one.png', type: 'image', mimeType: 'image/png', size: 1 },
            ],
            pagination: { page: 1, limit: 100, total: 101 },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            files: [
              { id: 'asset_101', name: 'target.png', url: 'https://example.com/target.png', type: 'image', mimeType: 'image/png', size: 1 },
            ],
            pagination: { page: 2, limit: 100, total: 101 },
          }),
        });

      vi.stubGlobal('fetch', fetchMock);

      const client = new RenderingVideo({
        apiKey: 'sk-test-key',
        baseUrl: 'https://api.example.com',
      });

      try {
        const file = await client.files.get('asset_101');

        expect(file?.id).toBe('asset_101');
        expect(fetchMock).toHaveBeenCalledTimes(2);
      } finally {
        vi.unstubAllGlobals();
      }
    });
  });

  describe('API Error Mapping', () => {
    it('should preserve the API validation error code', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'Invalid config',
          code: 'INVALID_CONFIG',
          details: { field: 'config' },
        }),
      });

      vi.stubGlobal('fetch', fetchMock);

      const client = new RenderingVideo({
        apiKey: 'sk-test-key',
        baseUrl: 'https://api.example.com',
      });

      try {
        await expect(
          client.video.create({
            config: {
              meta: { version: '2.0.0', width: 1920, height: 1080 },
              tracks: [],
            },
          })
        ).rejects.toMatchObject({
          name: 'ValidationError',
          code: 'INVALID_CONFIG',
          details: { field: 'config', statusCode: 400 },
        });
      } finally {
        vi.unstubAllGlobals();
      }
    });
  });
});

describe('Type Exports', () => {
  it('should export all required types', () => {
    // This is a compile-time check - if this compiles, types are exported correctly
    type CheckTypes = {
      videoConfig: import('./index').VideoConfig;
      task: import('./index').Task;
      taskList: import('./index').TaskList;
      credits: import('./index').Credits;
      previewResult: import('./index').PreviewResult;
      uploadResult: import('./index').UploadResult;
      fileList: import('./index').FileList;
      createVideoOptions: import('./index').CreateVideoOptions;
      renderOptions: import('./index').RenderOptions;
    };

    expect(true).toBe(true);
  });
});
