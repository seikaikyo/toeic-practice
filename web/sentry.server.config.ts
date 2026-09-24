import * as Sentry from "@sentry/nextjs";
import { SENTRY_DSN } from "./lib/sentry-dsn";

Sentry.init({
  dsn: process.env.SENTRY_DSN || SENTRY_DSN,
  enabled: process.env.NODE_ENV !== "development",
  environment: process.env.VERCEL_ENV ?? "development",
  release: process.env.VERCEL_GIT_COMMIT_SHA,
  tracesSampleRate: 0.2,
});
