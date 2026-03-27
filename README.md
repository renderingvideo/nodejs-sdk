# @renderingvideo/sdk

Official Node.js SDK for the RenderingVideo API. Create videos programmatically with ease.

## Installation

```bash
npm install @renderingvideo/sdk
# or
yarn add @renderingvideo/sdk
# or
pnpm add @renderingvideo/sdk
```

## Quick Start

```typescript
import { RenderingVideo } from '@renderingvideo/sdk';

// Initialize client
const client = new RenderingVideo({ apiKey: 'sk-your-api-key' });

// Create a video task
const task = await client.video.create({
  config: {
    meta: { version: '2.0.0', width: 1920, height: 1080, fps: 30 },
    tracks: [
      {
        clips: [
          { type: 'text', text: 'Hello World', start: 0, duration: 5 }
        ]
      }
    ]
  }
});

// Start rendering
const renderTask = await client.video.render(task.taskId, {
  webhookUrl: 'https://your-server.com/webhook'
});

console.log('Task ID:', renderTask.taskId);
console.log('Status:', renderTask.status);
```

## Features

- **Video Creation**: Create and render videos programmatically
- **Task Management**: List, get, and delete video tasks
- **File Management**: Upload and manage assets (images, videos, audio)
- **Preview Links**: Create temporary preview links without consuming credits
- **Credit Management**: Check your credit balance
- **Webhook Support**: Configure webhooks for completion notifications
- **TypeScript**: Full TypeScript support with type definitions
- **Zero Dependencies**: No external runtime dependencies

## API Reference

### Client Initialization

```typescript
import { RenderingVideo } from '@renderingvideo/sdk';

// With options object
const client = new RenderingVideo({
  apiKey: 'sk-xxx',           // Required: Your API key
  baseUrl: 'https://...',     // Optional: Custom API URL
  timeout: 30000              // Optional: Request timeout in ms (default: 30000)
});

// Or with positional arguments
const client = new RenderingVideo('sk-xxx', { timeout: 60000 });
```

### Video Operations

```typescript
// Create video task (does not start rendering)
const task = await client.video.create({
  config: { ... },              // VideoSchema configuration
  metadata: { key: 'value' }    // Optional: Custom metadata
});

// Create and immediately start rendering
const task = await client.video.createAndRender({
  config: { ... },
  webhookUrl: 'https://...',    // Optional: Webhook for completion notification
  numWorkers: 5                 // Optional: Number of render workers (default: 5)
});

// List video tasks
const { tasks, pagination } = await client.video.list({
  page: 1,
  limit: 20,
  status: 'completed'           // Optional: Filter by status
});

// Get task details
const task = await client.video.get('task-id');

// Trigger rendering
const renderTask = await client.video.render('task-id', {
  webhookUrl: 'https://...',
  numWorkers: 5
});

// Delete a task
const result = await client.video.delete('task-id');
console.log(result.deleted, result.remoteDeleted);
```

### File Operations

```typescript
// Upload a single file (Browser)
const fileInput = document.querySelector('#file-input');
const { assets } = await client.files.uploadFile(fileInput.files[0]);

// Upload from buffer (Node.js)
const fs = require('fs');
const buffer = fs.readFileSync('./image.png');
const { assets } = await client.files.uploadBuffer(buffer, 'image.png', 'image/png');

// Upload with FormData
const formData = new FormData();
formData.append('file', blob, 'video.mp4');
const { assets } = await client.files.upload(formData);

// List uploaded files
const { files, pagination } = await client.files.list({
  page: 1,
  limit: 50,
  type: 'image'                 // Optional: Filter by 'image', 'video', or 'audio'
});

// Delete a file
const result = await client.files.delete('asset-id');
```

### Preview Operations

```typescript
// Create a temporary preview (7 days validity, no credits)
const preview = await client.preview.create({
  meta: { version: '2.0.0', width: 1920, height: 1080 },
  tracks: [...]
});
console.log(preview.previewUrl, preview.tempId);

// Get preview configuration
const { config } = await client.preview.get('temp-id');

// Convert preview to permanent task (no rendering)
const result = await client.preview.convert('temp-id', {
  category: 'marketing'         // Optional
});

// Convert and immediately render
const result = await client.preview.render('temp-id', {
  category: 'api',              // Optional
  webhookUrl: 'https://...',    // Optional
  numWorkers: 5                 // Optional
});
```

### Credits

```typescript
// Get credit balance
const { credits } = await client.credits.get();
console.log(`Available: ${credits} credits`);

// Check if enough credits
const hasEnough = await client.credits.hasEnough(100);
```

## Error Handling

```typescript
import {
  RenderingVideoError,
  AuthenticationError,
  InvalidApiKeyError,
  InsufficientCreditsError,
  ValidationError,
  NotFoundError,
  AlreadyRenderingError,
  UploadError,
  StorageLimitError,
} from '@renderingvideo/sdk';

try {
  const task = await client.video.create({ config: {...} });
} catch (error) {
  if (error instanceof InsufficientCreditsError) {
    console.log('Not enough credits');
  } else if (error instanceof AlreadyRenderingError) {
    console.log('Task is already rendering');
  } else if (error instanceof ValidationError) {
    console.log('Invalid config:', error.message);
  } else if (error instanceof NotFoundError) {
    console.log('Task not found');
  } else if (error instanceof StorageLimitError) {
    console.log('Storage quota exceeded');
  } else if (error instanceof RenderingVideoError) {
    console.log(`API error [${error.code}]: ${error.message}`);
  }
}
```

## Webhook Handling

When rendering completes, the webhook receives:

```typescript
interface WebhookPayload {
  taskId: string;
  renderTaskId: string;
  status: 'completed' | 'failed';
  videoUrl?: string;
  error?: string | null;
  timestamp: string;
}
```

Example Express.js handler:

```typescript
app.post('/webhook', express.json(), (req, res) => {
  const { taskId, status, videoUrl, error } = req.body;

  if (status === 'completed') {
    console.log(`Video ${taskId} ready: ${videoUrl}`);
  } else {
    console.log(`Video ${taskId} failed: ${error}`);
  }

  res.status(200).send('OK');
});
```

## TypeScript Support

This SDK is written in TypeScript and provides full type definitions.

```typescript
import type {
  // Configuration
  VideoConfig,
  VideoMeta,
  Track,
  Clip,
  Asset,
  // Task
  Task,
  TaskList,
  TaskStatus,
  // Files
  UploadedFile,
  UploadResult,
  FileList,
  // Preview
  PreviewResult,
  PreviewConfig,
  // Credits
  Credits,
  // Options
  CreateVideoOptions,
  RenderOptions,
  ListTasksOptions,
  ClientOptions,
} from '@renderingvideo/sdk';
```

## Credit Calculation

- **Cost = Video duration (seconds) × Quality multiplier**

| Quality | Short Edge | Multiplier |
|---------|------------|------------|
| 720p    | ≥720px     | 1.0        |
| 1080p   | ≥1080px    | 1.5        |
| 2K      | ≥1440px    | 2.0        |

## Requirements

- Node.js 18.0.0 or higher
- No external runtime dependencies

## License

MIT License
