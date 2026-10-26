import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";

// CSP 只放實際用到的來源。
// - API 走同源 /api/backend/toeic，Sentry 走 tunnelRoute /monitoring，所以 connect-src 是 'self'；
//   ingest 留著，tunnel 失效時還能回報。
// - 單字、例句、聽力音檔在 Vercel Blob（NEXT_PUBLIC_BLOB_BASE），part1 音檔在 /audio。
// - 'unsafe-inline' / 'unsafe-eval' 是 App Router hydration 需要的，收緊要走 nonce，另案處理。
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "media-src 'self' https://sp1vz5mua9vmz9jf.public.blob.vercel-storage.com",
  "connect-src 'self' https://*.ingest.us.sentry.io",
  "worker-src 'self' blob:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

// 後端轉送走 app/api/backend/toeic/[...path]/route.ts，不用 rewrite。
// dashai-go 的 origin lock 是 enforce，轉送要帶 X-Origin-Key，
// 而 rewrite 加不了自訂標頭。
const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default withSentryConfig(nextConfig, {
  org: "dashai-jz",
  project: "toeic-practice",

  // 沒有 SENTRY_AUTH_TOKEN 時跳過 source map 上傳，本機建構不會因此失敗。
  silent: !process.env.CI,
  // disableLogger 已棄用，改用這個。
  webpack: { treeshake: { removeDebugLogging: true } },

  // Sentry 的自動檢測路由會經過 /monitoring，擋廣告的擴充套件不會擋掉它。
  tunnelRoute: "/monitoring",

  // 幫自己打包的程式碼做記號，instrumentation-client.ts 的
  // thirdPartyErrorFilterIntegration 靠它認出瀏覽器擴充套件注入的程式。
  applicationKey: "toeic-practice",
});
