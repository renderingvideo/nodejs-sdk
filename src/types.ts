/**
 * RenderingVideo Node.js SDK - Type Definitions
 */

// ==================== Video Configuration ====================

export interface VideoMeta {
  version: string;
  width: number;
  height: number;
  fps?: number;
  background?: string;
}

export interface VideoConfig {
  meta: VideoMeta;
  tracks: Track[];
  assets?: Record<string, Asset>;
}

export interface Track {
  clips: Clip[];
}

export interface Clip {
  type: string;
  start: number;
  duration: number;
  [key: string]: unknown;
}

export interface Asset {
  type: 'image' | 'video' | 'audio' | 'font';
  src: string;
  [key: string]: unknown;
}

// ==================== Task ====================

export type TaskStatus = 'created' | 'rendering' | 'completed' | 'failed';

export interface Task {
  success: boolean;
  taskId: string;
  videoTaskId?: string;
  renderTaskId?: string;
  previewUrl?: string;
  viewerUrl?: string;
  configUrl?: string;
  videoUrl?: string;
  status: TaskStatus;
  quality?: string;
  costCredits?: number;
  cost?: number;
  remainingCredits?: number;
  width?: number;
  height?: number;
  duration?: number;
  createdAt?: string;
  completedAt?: string;
  metadata?: Record<string, unknown>;
  message?: string;
  alreadyRendered?: boolean;
}

export interface TaskList {
  success: boolean;
  tasks: Task[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

// ==================== File / Asset ====================

export type FileType = 'image' | 'video' | 'audio';

export interface UploadedFile {
  id: string;
  name: string;
  url: string;
  type: FileType;
  mimeType: string;
  size: number;
  createdAt: string;
}

export interface UploadResult {
  success: boolean;
  message: string;
  count: number;
  assets: UploadedFile[];
}

export interface FileList {
  success: boolean;
  files: UploadedFile[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

export interface DeleteFileResult {
  success: boolean;
  fileId: string;
  deleted: boolean;
  message: string;
}

// ==================== Credits ====================

export interface Credits {
  success: boolean;
  credits: number;
  currency: string;
}

// ==================== Preview ====================

export interface PreviewResult {
  success: boolean;
  tempId: string;
  previewUrl: string;
  viewerUrl?: string;
  expiresIn: string;
  note?: string;
}

export interface PreviewConfig {
  success: boolean;
  tempId: string;
  config: VideoConfig;
}

export interface DeletePreviewResult {
  success: boolean;
  tempId: string;
  deleted: boolean;
  message: string;
}

export interface ConvertPreviewResult {
  success: boolean;
  tempId: string;
  converted: boolean;
  taskId: string;
  videoTaskId?: string;
  previewUrl?: string;
  viewerUrl?: string;
  configUrl?: string;
  message: string;
}

export interface RenderPreviewResult {
  success: boolean;
  tempId: string;
  converted: boolean;
  convertMessage?: string;
  configUrl?: string;
  taskId: string;
  renderTaskId?: string;
  status: TaskStatus;
  quality?: string;
  width?: number;
  height?: number;
  cost?: number;
  remainingCredits?: number;
  message?: string;
  previewUrl?: string;
  viewerUrl?: string;
}

// ==================== Delete Task ====================

export interface DeleteTaskResult {
  success: boolean;
  taskId: string;
  videoTaskId?: string;
  deleted: boolean;
  remoteDeleted: boolean;
  message: string;
}

// ==================== Client Options ====================

export interface ClientOptions {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
}

// ==================== Request Options ====================

export interface CreateVideoOptions {
  config: VideoConfig;
  metadata?: Record<string, unknown>;
}

export interface ListTasksOptions {
  page?: number;
  limit?: number;
  status?: TaskStatus;
}

export interface RenderOptions {
  webhookUrl?: string;
  numWorkers?: number;
}

export interface ListFilesOptions {
  page?: number;
  limit?: number;
  type?: FileType;
}

export interface UploadOptions {
  file?: Blob | File;
  files?: (Blob | File)[];
}

export interface ConvertPreviewOptions {
  category?: string;
}

export interface RenderPreviewOptions {
  category?: string;
  webhookUrl?: string;
  numWorkers?: number;
}

// ==================== API Response ====================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  details?: Record<string, unknown>;
}

// ==================== Webhook ====================

export interface WebhookPayload {
  taskId: string;
  renderTaskId: string;
  status: 'completed' | 'failed';
  videoUrl?: string;
  error?: string | null;
  timestamp: string;
}
