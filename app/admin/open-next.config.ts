import type { OpenNextConfig } from "@opennextjs/cloudflare";

/**
 * OpenNext configuration for Ignition Admin
 * 
 * This enables the Next.js admin console to run on Cloudflare Workers.
 */
export default {
  // Use Cloudflare Workers runtime
  default: {
    override: {
      wrapper: "cloudflare-node",
      converter: "edge",
    },
  },
} satisfies OpenNextConfig;
