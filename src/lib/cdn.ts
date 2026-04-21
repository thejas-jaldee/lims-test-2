const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");
const trimLeadingSlash = (value: string) => value.replace(/^\/+/, "");

declare global {
  interface Window {
    __APP_CDN_URL__?: string;
  }
}

const envCdnUrl = import.meta.env.VITE_CDN_URL?.trim() ?? "";

export function initializeCdnPath() {
  const normalized = trimTrailingSlash(envCdnUrl);

  if (typeof window !== "undefined") {
    window.__APP_CDN_URL__ = normalized;
  }

  if (typeof document !== "undefined") {
    document.documentElement.style.setProperty("--app-cdn-url", normalized);
  }

  return normalized;
}

export function getCdnPath() {
  if (typeof window !== "undefined" && window.__APP_CDN_URL__ !== undefined) {
    return window.__APP_CDN_URL__;
  }

  return trimTrailingSlash(envCdnUrl);
}

export function getCdnAssetUrl(assetPath: string) {
  const cdnPath = getCdnPath();
  const normalizedAssetPath = trimLeadingSlash(assetPath);

  return cdnPath ? `${cdnPath}/${normalizedAssetPath}` : `/${normalizedAssetPath}`;
}
