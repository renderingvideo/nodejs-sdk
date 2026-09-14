import { createHash, createPublicKey, verify } from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AgentAuth } from './agent';

afterEach(() => vi.unstubAllGlobals());
describe('AgentAuth', () => {
  it('signs the exact query and token hash, shares an exchange and generates fresh nonces', async () => {
    const device = AgentAuth.generateDevice();
    const fetchMock = vi.fn(async (_url, init) => {
      const sent = JSON.parse(init.body);
      expect(sent.device.publicKey).toBe(device.publicKey);
      expect(sent.device.privateKey).toBeUndefined();
      expect(init.redirect).toBe('error');
      return new Response(JSON.stringify({ success: true, access_token: 'at_test', expires_in: 300 }));
    });
    vi.stubGlobal('fetch', fetchMock);
    const auth = new AgentAuth({ agentKey: 'ak_test', device });
    const url = new URL('https://renderingvideo.com/api/agent/v1/audit?riskLevel=high%20risk&allKeys=true');
    const [a, b] = await Promise.all([auth.headers('GET', url), auth.headers('GET', url)]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(a['x-agent-nonce']).not.toBe(b['x-agent-nonce']);
    const payload = ['RV-AGENT-PROOF-V1', 'GET', url.pathname + url.search, a['x-agent-timestamp'], a['x-agent-nonce'], createHash('sha256').update('at_test').digest('base64url')].join('\n');
    const publicKey = createPublicKey({ key: { kty: 'OKP', crv: 'Ed25519', x: device.publicKey }, format: 'jwk' });
    expect(verify(null, Buffer.from(payload), publicKey, Buffer.from(a['x-agent-signature'], 'base64url'))).toBe(true);
    expect(verify(null, Buffer.from(payload.replace('allKeys=true', 'allKeys=false')), publicKey, Buffer.from(a['x-agent-signature'], 'base64url'))).toBe(false);
    auth.invalidate();
    await auth.headers('GET', url);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
  it('rejects remote HTTP, a different origin and mismatched device keys', async () => {
    const device = AgentAuth.generateDevice();
    expect(() => new AgentAuth({ agentKey: 'ak_test', device, baseUrl: 'http://example.com' })).toThrow('HTTPS');
    expect(() => new AgentAuth({ agentKey: 'ak_test', device: { ...device, publicKey: AgentAuth.generateDevice().publicKey } })).toThrow('matching');
    const auth = new AgentAuth({ agentKey: 'ak_test', device });
    await expect(auth.headers('GET', new URL('https://example.com/api/v1/credits'))).rejects.toThrow('outside');
  });
  it('surfaces exchange rejection without caching a token or replaying requests', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ success: false, error: 'Device blocked', code: 'DEVICE_BLOCKED' }), { status: 403 }));
    vi.stubGlobal('fetch', fetchMock);
    const auth = new AgentAuth({ agentKey: 'ak_test', device: AgentAuth.generateDevice() });
    await expect(auth.headers('GET', new URL('https://renderingvideo.com/api/v1/credits'))).rejects.toMatchObject({ code: 'DEVICE_BLOCKED' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
