import type { MetadataRoute } from "next";
import { publicUrl } from "@/lib/public-url";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/cliente", "/produtor", "/parceiro", "/entregador", "/api"],
    },
    sitemap: publicUrl("/sitemap.xml"),
  };
}
