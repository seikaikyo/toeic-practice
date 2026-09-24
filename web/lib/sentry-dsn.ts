// DSN 是公開值，瀏覽器端本來就會把它打包進 bundle，寫在程式裡不算洩漏。
// 環境變數有設就用環境變數，方便之後換專案。
export const SENTRY_DSN =
  process.env.NEXT_PUBLIC_SENTRY_DSN ||
  "https://ae955bb538f21ba707e2a3a829130ea0@o4511162203766784.ingest.us.sentry.io/4512122776059904";
