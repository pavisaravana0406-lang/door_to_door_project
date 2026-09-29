import type {
  SWMSAssignment,
  QRAdminListResult,
  QROptionsResult,
  QRCreateResult,
  QRGenerateSinglePayload,
} from '../types';

const RENDER_API_URL = 'https://swms-fastapi-backend.onrender.com';

export const API_BASE: string = (() => {
  const fromEnv = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/+$/, '');
  if (fromEnv) return fromEnv;
  try {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    return isLocalhost ? 'http://localhost:8001' : RENDER_API_URL;
  } catch {
    return RENDER_API_URL;
  }
})();

export interface ApiError {
  message: string;
  status?: number;
}

interface RequestOptions extends RequestInit {
  token?: string | null;
  /** Abort the request after this many ms. Default 20000. */
  timeoutMs?: number;
}

export async function apiFetch<T = any>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  if (options.token) {
    headers.set('Authorization', `Bearer ${options.token}`);
  }

  let res: Response;
  const controller = new AbortController();
  // Guard against a stalled server: without this a single request can hang the
  // UI indefinitely (e.g. logout waiting on an unreachable backend).
  const timeoutMs = (options as RequestOptions & { timeoutMs?: number }).timeoutMs ?? 20000;
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
      signal: controller.signal,
    });
  } catch (e: any) {
    if (e?.name === 'AbortError') {
      throw new Error('The server took too long to respond. Please try again.');
    }
    throw new Error('Unable to reach the SWMS server. Please check your connection and try again.');
  } finally {
    clearTimeout(timer);
  }

  let data: any = {};
  try {
    data = await res.json();
  } catch {
    // non-JSON response
  }

  if (!res.ok) {
    const detail =
      typeof data?.detail === 'string'
        ? data.detail
        : Array.isArray(data?.detail)
          ? (data.detail[0]?.msg ?? data.detail[0]?.detail ?? 'Invalid request')
          : data?.message;
    throw new Error(detail || `Request failed (${res.status})`);
  }
  return data as T;
}

// ── Auth ────────────────────────────────────────────────────────────────────────────────

export interface LoginResult {
  success: boolean;
  token: string;
  user: SWMSAssignment;
  message?: string;
}

export const authLogin = async (username: string, password: string): Promise<LoginResult> => {
  const uClean = (username || '').trim();
  const pClean = (password || '').trim();

  if (!uClean) throw new Error('Please enter your Username / Officer ID.');
  if (!pClean) throw new Error('Please enter your Password.');

  // Strict live authentication only — fail closed, never fabricate a session.
  const res = await apiFetch<LoginResult>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username: uClean, password: pClean }),
  });
  if (!res || !res.token) {
    throw new Error('Server did not return a session token. Please try again.');
  }
  return res;
};

export const authMe = (token: string) => apiFetch<LoginResult>('/api/auth/me', { token });

export const authLogout = (token: string) =>
  apiFetch<{ success: boolean; message?: string }>('/api/auth/logout', {
    method: 'POST',
    token,
    // Revoking is fire-and-forget after the user is already logged out locally,
    // so cap it hard rather than letting it sit on the default timeout.
    timeoutMs: 5000,
  });

// ── Dashboard / Checkpoints ──────────────────────────────────────────────────────────────

export const fetchDashboard = async (token: string): Promise<any> => {
  // Fail closed: auth errors (401/403) must propagate so the UI logs out.
  // No synthetic fallback dashboard — it masked auth failures with wrong shape.
  return apiFetch<any>('/api/swms/dashboard', { token });
};

/** Fetch ALL live SWMS household records + stats from Neon PostgreSQL (/api/swms/data). */
export const fetchSWMSData = async (token: string): Promise<any> => {
  try {
    return await apiFetch<any>('/api/swms/data', { token });
  } catch (err: any) {
    const msg = String(err?.message || '');
    // 401/403 = session invalid → must propagate so App can force logout.
    if (/401|403|session|expired|auth/i.test(msg)) throw err;
    console.warn('Live SWMS data API unavailable, returning empty records cache:', msg);
    return { records: [], stats: null };
  }
};

/** Grounded SWMS Copilot predictive audit — deterministic analytics on live Neon household records (/api/swms/ai-audit). */
export const fetchSWMSAIAudit = (token: string) =>
  apiFetch<any>('/api/swms/ai-audit', {
    method: 'POST',
    token,
  });

export const resolveCheckpoint = (token: string, qrId: string) =>
  apiFetch<any>(`/api/swms/checkpoint/${encodeURIComponent(qrId)}`, { token });

export interface CollectionSubmitPayload {
  qrId: string;
  status: 'Collected' | 'Not Collected';
  remarks?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  photos?: string[] | null;
}

export const submitCollection = (token: string, payload: CollectionSubmitPayload) =>
  apiFetch<any>('/api/swms/collection/submit', {
    method: 'POST',
    body: JSON.stringify(payload),
    token,
  });

// ── Scan Evidence Photos ──────────────────────────────────────────────────────────────

export interface ScanPhotoUploadPayload {
  routeId?: string;
  streetName?: string;
  photoBase64: string;
  contentType?: string;
}

export const uploadScanPhoto = (token: string, payload: ScanPhotoUploadPayload) =>
  apiFetch<any>('/api/swms/photos', {
    method: 'POST',
    body: JSON.stringify(payload),
    token,
  });

export const scanPhotoUrl = (fileName: string, token?: string | null) =>
  `${API_BASE}/api/swms/photos/${encodeURIComponent(fileName)}${token ? `?token=${encodeURIComponent(token)}` : ''}`;

// ── QR Checkpoint Management (Admin) ──────────────────────────────────────────────────────

export const adminQROptions = (
  token: string,
  zone?: string,
  ward?: string,
): Promise<QROptionsResult> => {
  const params = new URLSearchParams();
  if (zone) params.set('zone', zone);
  if (ward) params.set('ward', ward);
  const qs = params.toString();
  return apiFetch<QROptionsResult>(`/api/admin/qr/options${qs ? `?${qs}` : ''}`, { token });
};

export const adminQRZones = (token: string, zone?: string): Promise<QRAdminListResult> => {
  const params = new URLSearchParams();
  if (zone) params.set('zone', zone);
  const qs = params.toString();
  return apiFetch<QRAdminListResult>(`/api/admin/qr/zones${qs ? `?${qs}` : ''}`, { token });
};

export const adminQRGenerateSingle = (
  token: string,
  payload: QRGenerateSinglePayload,
): Promise<QRCreateResult> =>
  apiFetch<QRCreateResult>('/api/admin/qr/generate/single', {
    method: 'POST',
    body: JSON.stringify(payload),
    token,
  });

export const adminQRGenerateZone = (token: string, zone: string): Promise<QRCreateResult> =>
  apiFetch<QRCreateResult>('/api/admin/qr/generate/zone', {
    method: 'POST',
    body: JSON.stringify({ zone }),
    token,
  });

/** Absolute URL for the dynamically generated QR PNG (backend source of truth). */
export const qrImageUrl = (qrId: string, size = 14) =>
  `${API_BASE}/api/admin/qr/image?qrId=${encodeURIComponent(qrId)}&size=${size}`;

/** Absolute URL that downloads the QR PNG (use with an anchor/link click). */
export const qrImageDownloadUrl = (qrId: string, size = 14) =>
  `${API_BASE}/api/admin/qr/image?qrId=${encodeURIComponent(qrId)}&size=${size}&download=1`;

/** ZIP download of every QR image in a zone (admin). */
export const adminQRDownloadAll = (token: string, zone: string): Promise<Blob> =>
  fetch(`${API_BASE}/api/admin/qr/download-all?zone=${encodeURIComponent(zone)}`, {
    headers: { Authorization: `Bearer ${token}` },
  }).then(async (res) => {
    if (!res.ok) {
      let detail = `Download failed (${res.status})`;
      try {
        const data = await res.json();
        if (typeof data?.detail === 'string') detail = data.detail;
      } catch {
        // ignore
      }
      throw new Error(detail);
    }
    return res.blob();
  });