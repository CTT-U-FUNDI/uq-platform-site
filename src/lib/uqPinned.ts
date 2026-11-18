import { registerPlugin } from '@capacitor/core';
import { Capacitor } from '@capacitor/core';

interface UqPinnedHttpPlugin {
  request(o: { url: string; method?: string; headers?: Record<string, string>; body?: string }):
    Promise<{ status: number; body: string }>;
}

const UqPinnedHttp = registerPlugin<UqPinnedHttpPlugin>('UqPinnedHttp');

/** Requete HTTP epinglee SSL — a utiliser pour les appels auth/cryptos sensibles.
 *  Sur web : fallback fetch normal. Sur Android : OkHttp + CertificatePinner. */
export async function pinnedRequest(
  url: string,
  opts: { method?: string; headers?: Record<string, string>; body?: unknown } = {},
): Promise<{ status: number; data: any }> {
  const method = opts.method || 'GET';
  const bodyStr = opts.body !== undefined ? JSON.stringify(opts.body) : undefined;
  // Bearer JWT comme apiFetch : les routes authentifiees (WebAuthn…) restent
  // couvertes par le pinning sur Android.
  const token = localStorage.getItem('uq_token');
  const headers: Record<string, string> = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    'Content-Type': 'application/json',
    ...(opts.headers || {}),
  };
  if (Capacitor.isNativePlatform()) {
    try {
      const r = await UqPinnedHttp.request({ url, method, headers, body: bodyStr });
      let data: any = null;
      try { data = JSON.parse(r.body); } catch { data = r.body; }
      return { status: r.status, data };
    } catch (e) {
      // Si le pin echoue (MITM/proxy), on NE retombe PAS sur fetch — on echoue.
      throw e;
    }
  }
  const resp = await fetch(url, {
    method,
    headers,
    body: bodyStr,
  });
  const data = await resp.json().catch(() => null);
  return { status: resp.status, data };
}

export default UqPinnedHttp;
