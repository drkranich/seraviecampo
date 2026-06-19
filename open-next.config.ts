import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig({
  // Cache incremental pode ser adicionado depois (R2/KV).
  // incrementalCache: r2IncrementalCache,
});
