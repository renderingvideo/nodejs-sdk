import { createHash, createPrivateKey, createPublicKey, generateKeyPairSync, randomBytes, randomUUID, sign } from 'node:crypto';
import { arch, hostname, platform } from 'node:os';
import { handleApiError } from './errors';

export interface AgentDevice {
  id: string;
  /** Raw Ed25519 public key, base64url without padding. */
  publicKey: string;
  /** PKCS8 DER private key, base64url. Persist securely and never transmit. */
  privateKey: string;
  name?: string;
  platform?: string;
  arch?: string;
}

export interface RequestAuth {
  baseUrl: string;
  headers(method: string, url: URL): Promise<Record<string, string>>;
}

/** Agent keys exchange for short-lived tokens; every request has a fresh device proof. */
export class AgentAuth implements RequestAuth {
  readonly baseUrl: string;
  private readonly privateKey: ReturnType<typeof createPrivateKey>;
  private token: { value: string; expiresAt: number } | null = null;
  private pending: Promise<void> | null = null;

  constructor(private readonly options: {
    agentKey: string;
    device: AgentDevice;
    baseUrl?: string;
    timeout?: number;
  }) {
    if (!options.agentKey?.startsWith('ak_')) throw new Error('Agent key must start with ak_');
    const url = new URL(options.baseUrl || 'https://renderingvideo.com');
    const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
    if (url.username || url.password || url.pathname !== '/' || url.search || url.hash ||
      (url.protocol !== 'https:' && !(url.protocol === 'http:' && local))) {
      throw new Error('Agent API baseUrl must be an HTTPS origin (HTTP is allowed for localhost)');
    }
    this.baseUrl = url.origin;
    if (!options.device.id?.trim()) throw new Error('A persistent device ID is required');
    this.privateKey = createPrivateKey({ key: Buffer.from(options.device.privateKey, 'base64url'), type: 'pkcs8', format: 'der' });
    const publicKey = createPublicKey(this.privateKey).export({ format: 'jwk' });
    if (publicKey.crv !== 'Ed25519' || publicKey.x !== options.device.publicKey) {
      throw new Error('Device public/private keys must be a matching Ed25519 pair');
    }
  }

  /** Generate once per device, then store and reuse the returned identity. */
  static generateDevice(): AgentDevice {
    const keys = generateKeyPairSync('ed25519');
    return {
      id: randomUUID(),
      publicKey: keys.publicKey.export({ format: 'jwk' }).x!,
      privateKey: keys.privateKey.export({ type: 'pkcs8', format: 'der' }).toString('base64url'),
      name: hostname(), platform: platform(), arch: arch(),
    };
  }

  private proof(credential: string, method: string, url: URL) {
    const timestamp = Date.now().toString();
    const nonce = randomBytes(24).toString('base64url');
    const payload = ['RV-AGENT-PROOF-V1', method.toUpperCase(), url.pathname + url.search,
      timestamp, nonce, createHash('sha256').update(credential).digest('base64url')].join('\n');
    return {
      'x-agent-device-id': this.options.device.id,
      'x-agent-timestamp': timestamp,
      'x-agent-nonce': nonce,
      'x-agent-signature': sign(null, Buffer.from(payload), this.privateKey).toString('base64url'),
    };
  }

  private async exchange() {
    const url = new URL('/api/agent/token', this.baseUrl);
    const { device, agentKey } = this.options;
    const response = await fetch(url, {
      method: 'POST', redirect: 'error', signal: AbortSignal.timeout(this.options.timeout ?? 30_000),
      headers: { authorization: `AgentKey ${agentKey}`, 'content-type': 'application/json', ...this.proof(agentKey, 'POST', url) },
      body: JSON.stringify({ device: {
        id: device.id, publicKey: device.publicKey, name: device.name || hostname(),
        platform: device.platform || platform(), arch: device.arch || arch(), agentVersion: 'renderingvideo-nodejs-sdk/1.1',
      } }),
    });
    const parsed: unknown = await response.json();
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Invalid JSON response from agent API');
    const data = parsed as Record<string, unknown>;
    if (!response.ok || data?.success === false) {
      throw handleApiError(response.status, typeof data.error === 'string' ? data.error : 'Agent token exchange failed', typeof data.code === 'string' ? data.code : 'TOKEN_EXCHANGE_FAILED', data || {});
    }
    if (typeof data?.access_token !== 'string' || !data.access_token.startsWith('at_') ||
      typeof data.expires_in !== 'number' || !Number.isFinite(data.expires_in) || data.expires_in <= 0) throw new Error('Invalid agent token response');
    this.token = { value: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  }

  /** Explicitly discard a token after expiry/revocation; writes are never automatically replayed. */
  invalidate() { this.token = null; }

  async headers(method: string, url: URL): Promise<Record<string, string>> {
    if (url.origin !== this.baseUrl || url.username || url.password ||
      !/^\/api\/(v1|agent\/v1)\//.test(url.pathname)) throw new Error('Agent request is outside the configured API origin');
    if (!this.token || this.token.expiresAt <= Date.now() + 30_000) {
      this.pending ??= this.exchange().finally(() => { this.pending = null; });
      await this.pending;
    }
    const token = this.token!.value;
    return { authorization: `Bearer ${token}`, ...this.proof(token, method, url) };
  }
}
