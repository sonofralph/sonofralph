import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const allowedOrigins = process.env.NEXTAUTH_URL
  ? [new URL(process.env.NEXTAUTH_URL).host]
  : ["localhost:3000", "localhost:3001"];

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins,
    },
  },
};

export default withSentryConfig(nextConfig, {
  silent: !process.env.CI,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  hideSourceMaps: true,
  disableLogger: true,
  automaticVercelMonitors: true,
});
