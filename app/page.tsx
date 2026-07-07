import { PublicHome } from "@/components/PublicHome";
import { createClient } from "@/lib/supabase/server";
import { getSite } from "@/lib/site";

export default async function Home() {
  const supabase = await createClient();
  const site = await getSite(supabase);

  return <PublicHome site={site} />;
}
