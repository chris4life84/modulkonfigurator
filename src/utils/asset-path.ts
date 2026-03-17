/**
 * Resolve a public asset path relative to the app's base URL.
 * In dev: base is "/", in production with subdir: base is "/newsite/".
 *
 * Usage: assetPath('/textures/foo.jpg') → '/newsite/textures/foo.jpg'
 */
export function assetPath(path: string): string {
  const base = import.meta.env.BASE_URL || '/';
  // Remove leading slash from path to avoid double slashes
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${base}${cleanPath}`;
}
