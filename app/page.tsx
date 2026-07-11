import { PublicHome } from "@/components/PublicHome";
import { getPublicDestinations } from "@/lib/public-destinations";
import { createClient } from "@/lib/supabase/server";
import { getSite } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = await createClient();
  const site = await getSite(supabase);
  const destinations = await getPublicDestinations(supabase, site);

  return <PublicHome site={site} destinations={destinations} />;
}
