/**
 * Cloudflare Web Analytics is cookieless and privacy-friendly (no Google
 * Analytics, ever). The beacon only loads when a token is configured via
 * VITE_CF_ANALYTICS_TOKEN, so local and untoken builds send nothing.
 */
export function initAnalytics(): void {
  const token = import.meta.env.VITE_CF_ANALYTICS_TOKEN;
  if (!token) return;
  const script = document.createElement('script');
  script.defer = true;
  script.src = 'https://static.cloudflareinsights.com/beacon.min.js';
  script.setAttribute('data-cf-beacon', JSON.stringify({ token }));
  document.head.appendChild(script);
}
