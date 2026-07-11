import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicInstitutionalPage } from "@/components/PublicInstitutionalPage";
import { createClient } from "@/lib/supabase/server";
import { findInstitutionalPage, getSite } from "@/lib/site";

async function loadInstitutionalPage(slug: string) {
  const supabase = await createClient();
  const site = await getSite(supabase);
  const page = findInstitutionalPage(site, slug);
  return { site, page };
}

export async function generateMetadata({ params }: { params: Promise<{ institutionalSlug: string }> }): Promise<Metadata> {
  const { institutionalSlug } = await params;
  const { site, page } = await loadInstitutionalPage(institutionalSlug);

  if (!page) return { title: site.seo_title, description: site.seo_description };

  return {
    title: page.seo_title || `${page.title} | ${site.brand}`,
    description: page.seo_description || page.summary,
    openGraph: {
      title: page.seo_title || `${page.title} | ${site.brand}`,
      description: page.seo_description || page.summary,
      images: page.image ? [{ url: page.image }] : undefined,
    },
  };
}

export default async function InstitutionalPageRoute({ params }: { params: Promise<{ institutionalSlug: string }> }) {
  const { institutionalSlug } = await params;
  const { site, page } = await loadInstitutionalPage(institutionalSlug);
  if (!page) notFound();

  return <PublicInstitutionalPage site={site} page={page} />;
}
