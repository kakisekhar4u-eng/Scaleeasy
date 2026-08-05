import type { MetadataRoute } from "next";
import { config } from "@/lib/config";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = config.appUrl;
  return ["/", "/concierge", "/concierge/discover", "/concierge/how-it-works", "/privacy", "/terms"].map(
    (path) => ({
      url: `${base}${path}`,
      changeFrequency: "weekly",
      priority: path === "/" ? 1 : 0.7,
    }),
  );
}
