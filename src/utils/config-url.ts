import { deflateRaw, inflateRaw } from 'pako';
import type { PlacedModule } from '../types/grid';

export interface ShareableConfig {
  templateId: string | null;
  modules: PlacedModule[];
}

/**
 * Encode a configuration into a URL-safe base64 string.
 * JSON → deflate → base64url
 */
export function encodeConfig(config: ShareableConfig): string {
  const json = JSON.stringify(config);
  const compressed = deflateRaw(new TextEncoder().encode(json));
  return base64UrlEncode(compressed);
}

/**
 * Decode a base64url string back into a configuration.
 * Returns null if the string is invalid or corrupted.
 */
export function decodeConfig(encoded: string): ShareableConfig | null {
  try {
    const compressed = base64UrlDecode(encoded);
    const json = new TextDecoder().decode(inflateRaw(compressed));
    const parsed = JSON.parse(json);

    // Basic validation
    if (!parsed || !Array.isArray(parsed.modules)) return null;

    return parsed as ShareableConfig;
  } catch {
    return null;
  }
}

/**
 * Build a full shareable URL for the current origin.
 */
export function buildShareUrl(config: ShareableConfig): string {
  const encoded = encodeConfig(config);
  const base = import.meta.env.BASE_URL || '/';
  return `${window.location.origin}${base}view?config=${encoded}`;
}

// ── Base64url helpers ────────────────────────────────────────────────

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(str: string): Uint8Array {
  // Restore standard base64
  let b64 = str.replace(/-/g, '+').replace(/_/g, '/');
  // Pad
  while (b64.length % 4) b64 += '=';
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
