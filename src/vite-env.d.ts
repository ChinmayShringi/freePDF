/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Ko-fi username for the optional tip jar. */
  readonly VITE_KOFI_HANDLE?: string;
  /** Cloudflare Web Analytics token (cookieless). */
  readonly VITE_CF_ANALYTICS_TOKEN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
