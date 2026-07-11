import type { MetadataRoute } from "next";
import { createClient as createRaw } from "@supabase/supabase-js";
import { getPublicDestinations } from "@/lib/public-destinations";
import { publicUrl } from "@/lib/public-url";
import { destinationHref, getSite } from "@/lib/site";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabase/config";

type PublicExperienceRow = { id: string; updated_at?: string | null; created_at?: string | null };

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createRaw(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } });
  const now = new Date();

  const site = await getSite(supabase);
  const destinations = await getPublicDestinations(supabase, site);
  const { data: experiences } = await supabase
    .from("experiences")
    .select("id, updated_at, created_at")
    .eq("active", true)
    .eq("archived", false)
    .order("created_at", { ascending: false })
    .limit(200);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: publicUrl("/"), lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: publicUrl("/destinos"), lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: publicUrl("/experiencias"), lastModified: now, changeFrequency: "daily", priority: 0.8 },
  ];

  const destinationRoutes: MetadataRoute.Sitemap = destinations.map((destination) => ({
    url: publicUrl(destinationHref(destination)),
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const institutionalRoutes: MetadataRoute.Sitemap = site.institutional_pages
    .filter((page) => page.slug)
    .map((page) => ({
      url: publicUrl(`/${page.slug}`),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    }));

  const experienceRoutes: MetadataRoute.Sitemap = ((experiences ?? []) as PublicExperienceRow[]).map((experience) => ({
    url: publicUrl(`/experiencias/${experience.id}`),
    lastModified: experience.updated_at || experience.created_at || now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...staticRoutes, ...destinationRoutes, ...institutionalRoutes, ...experienceRoutes];
}
