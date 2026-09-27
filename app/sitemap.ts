import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

// One page. Add an entry here if the site ever grows a second route.
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: siteUrl, changeFrequency: "monthly", priority: 1 }];
}
