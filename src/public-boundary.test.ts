import { expect, it, vi } from 'vitest';
import * as sdk from './index';

it('rejects administrator credentials before any network call', () => {
  const fetch = vi.spyOn(globalThis, 'fetch');
  try {
    for (const apiKey of ['ak_admin-fixture', 'at_admin-fixture']) {
      expect(() => new sdk.RenderingVideo({ apiKey })).toThrow(/sk-/);
    }
    expect(() => new sdk.RenderingVideo({ auth: {} } as never)).toThrow(/API key/);
    expect(fetch).not.toHaveBeenCalled();
    expect('AgentAuth' in sdk).toBe(false);
    expect('agent' in new sdk.RenderingVideo('sk-user-fixture')).toBe(false);
  } finally { fetch.mockRestore(); }
});
