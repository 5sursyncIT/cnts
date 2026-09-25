// Custom Next.js image loader.
//
// Context: the portal runs under `basePath: "/app"`, which moves everything in
// public/ to `/app/...`. Two problems follow for next/image:
//   1. The default loader emits optimizer URLs whose `url` param lacks the
//      basePath, so the optimizer looks for `/images/...` (404) instead of
//      `/app/images/...`, returning a 400 "not a valid image".
//   2. SVGs (most of this site's illustrations) are rejected by the optimizer
//      unless `dangerouslyAllowSVG` is set.
//
// Setting a custom loader disables Next's built-in /_next/image endpoint, so we
// cannot route back through it. Instead we resolve to the original asset under
// the basePath and let the standalone server serve it directly. The site's
// images are already small/vector, so skipping on-the-fly optimization is a
// non-issue and avoids the basePath + SVG pitfalls entirely.
const BASE_PATH = "/app";

export default function cntsImageLoader({ src }: { src: string }): string {
  // Leave absolute/remote URLs untouched.
  if (/^https?:\/\//.test(src)) return src;
  // Already prefixed (defensive against double-prefixing).
  if (src.startsWith(`${BASE_PATH}/`)) return src;
  return `${BASE_PATH}${src.startsWith("/") ? src : `/${src}`}`;
}
