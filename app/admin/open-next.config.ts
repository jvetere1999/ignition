import type { OpenNextConfig } from "@opennextjs/cloudflare";

/**
 * OpenNext configuration for Ignition Admin
 *
 * This enables the Next.js admin console to run on Cloudflare Workers.
 * @see https://opennext.js.org/cloudflare
 */
const config: OpenNextConfig = {
  default: {
    override: {
      wrapper: "cloudflare-node",
      converter: "edge",
      proxyExternalRequest: "fetch",
      incrementalCache: "dummy",
      tagCache: "dummy",
      queue: "direct",
    },
  },
  // External node modules that need special handling
  edgeExternals: ["node:crypto"],
  // Middleware runs on edge
  middleware: {
    external: true,
    override: {
      wrapper: "cloudflare-edge",
      converter: "edge",
      proxyExternalRequest: "fetch",
      incrementalCache: "dummy",
      tagCache: "dummy",
      queue: "direct",
    },
  },
};

export default config;
