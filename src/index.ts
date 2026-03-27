/**
 * RenderingVideo Node.js SDK
 *
 * Official Node.js SDK for the RenderingVideo API
 *
 * @packageDocumentation
 *
 * @example
 * ```typescript
 * import { RenderingVideo } from '@renderingvideo/sdk';
 *
 * const client = new RenderingVideo({ apiKey: 'sk-xxx' });
 *
 * // Create a video task
 * const task = await client.video.create({
 *   config: {
 *     meta: { version: '2.0.0', width: 1920, height: 1080, fps: 30 },
 *     tracks: [{ clips: [{ type: 'text', text: 'Hello World', start: 0, duration: 5 }] }]
 *   }
 * });
 *
 * // Start rendering
 * await client.video.render(task.taskId, {
 *   webhookUrl: 'https://example.com/webhook'
 * });
 *
 * // Check credits
 * const { credits } = await client.credits.get();
 * ```
 */

// Main client
export { RenderingVideo, VideoClient, FileClient, PreviewClient, CreditsClient } from './client';

// Types
export type {
  // Video Configuration
  VideoMeta,
  VideoConfig,
  Track,
  Clip,
  Asset,
  // Task
  TaskStatus,
  Task,
  TaskList,
  DeleteTaskResult,
  // Files
  FileType,
  UploadedFile,
  UploadResult,
  FileList,
  DeleteFileResult,
  // Credits
  Credits,
  // Preview
  PreviewResult,
  PreviewConfig,
  DeletePreviewResult,
  ConvertPreviewResult,
  RenderPreviewResult,
  // Options
  ClientOptions,
  CreateVideoOptions,
  ListTasksOptions,
  RenderOptions,
  ListFilesOptions,
  UploadOptions,
  ConvertPreviewOptions,
  RenderPreviewOptions,
  // Response
  ApiResponse,
  // Webhook
  WebhookPayload,
} from './types';

// Errors
export {
  RenderingVideoError,
  AuthenticationError,
  InvalidApiKeyError,
  InsufficientCreditsError,
  ValidationError,
  NotFoundError,
  RateLimitError,
  AlreadyRenderingError,
  UploadError,
  StorageLimitError,
  RemoteError,
} from './errors';

// Default export
import { RenderingVideo as RenderingVideoClient } from './client';
export default RenderingVideoClient;
