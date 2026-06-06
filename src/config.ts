/**
 * App-level configuration. Support handles are placeholders until real ones are
 * provided; override at build time with the matching Vite env vars. The tip jar
 * is always optional and never gates a feature.
 */

/** Ko-fi username, e.g. `https://ko-fi.com/<handle>`. */
export const KOFI_HANDLE = import.meta.env.VITE_KOFI_HANDLE ?? 'freepdf';

/** Full tip-jar URL. */
export const SUPPORT_URL = `https://ko-fi.com/${KOFI_HANDLE}`;

/** Project source repository. */
export const REPO_URL = 'https://github.com/ChinmayShringi/freePDF';
