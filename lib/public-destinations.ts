import type { SupabaseClient } from "@supabase/supabase-js";
import { CATEGORY_LABEL, UNIT_LABEL, formatBRL, type ProductCategory, type ProductUnit } from "@/lib/catalog";
import { EXP_CATEGORY_LABEL, durationLabel, formatExpPrice, type ExperienceCategory } from "@/lib/experiences";
import { producerName } from "@/lib/profile";
import { slugify, type DestinationItem, type SiteContent } from "@/lib/site";

type ProducerRow = {
  id: string;
  role: string | null;
  full_name: string | null;
  display_name: string | null;
  farm_name: string | null;
  city: string | null;
  state: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  bio: string | null;
  verification_status: string | null;
};

type ProductDestinationRow = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  price_cents: number | null;
  unit: string | null;
  stock: number | null;
  is_organic: boolean | null;
  image_url: string | null;
  images: unknown;
  created_at: string | null;
  producer: ProducerRow | null;
};

type ExperienceDestinationRow = {
  id: string;
  title: string;
  summary: string | null;
  category: string | null;
  price_cents: number | null;
  currency: string | null;
  duration_min: number | null;
  images: unknown;
  location: string | null;
  created_at: string | null;
  producer: ProducerRow | null;
};

type DestinationLocation = {
  name: string;
  city: string;
  state: string;
  slug: string;
  region: string;
};

type DestinationAggregate = DestinationLocation & {
  image: string;
  product_count: number;
  experience_count: number;
  producers: Map<string, DestinationProducer>;
  products: ProductDestinationRow[];
  experiences: ExperienceDestinationRow[];
  lastCreated: string | null;
};

export type PublicDestination = DestinationItem & {
  source: "cms" | "automatic";
  listing_count: number;
  product_count: number;
  experience_count: number;
  producer_count: number;
  city?: string;
  state?: string;
  offer_label: string;
};

export type DestinationProduct = {
  id: string;
  name: string;
  description: string;
  category_label: string;
  price_label: string;
  image: string;
  producer_name: string;
  location: string;
  is_organic: boolean;
};

export type DestinationExperience = {
  id: string;
  title: string;
  summary: string;
  category_label: string;
  price_label: string;
  duration_label: string;
  image: string;
  producer_name: string;
  location: string;
};

export type DestinationProducer = {
  id: string;
  name: string;
  role: string;
  avatar_url: string | null;
  cover_url: string | null;
  bio: string;
  location: string;
  verified: boolean;
};

export type DestinationListings = {
  products: DestinationProduct[];
  experiences: DestinationExperience[];
  producers: DestinationProducer[];
};

const PRODUCER_FIELDS =
  "id, role, full_name, display_name, farm_name, city, state, avatar_url, cover_url, bio, verification_status";

function clean(value: string | null | undefined) {
  return String(value ?? "").trim();
}

function isSeraviePublisher(producer: ProducerRow | null | undefined) {
  if (!producer) return false;
  return (producer.role === "produtor" || producer.role === "parceiro") && producer.verification_status !== "rejeitado";
}

function imagesFrom(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (Array.isArray(parsed)) return parsed.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
    } catch {
      return [value];
    }
  }
  return [];
}

function firstImage(...values: Array<unknown>) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value;
    const [image] = imagesFrom(value);
    if (image) return image;
  }
  return "";
}

function locationFrom(city: string | null | undefined, state: string | null | undefined): DestinationLocation | null {
  const normalizedCity = clean(city);
  const normalizedState = clean(state);
  const name = normalizedCity || normalizedState;
  const slug = slugify(name);

  if (!name || !slug) return null;

  return {
    name,
    city: normalizedCity,
    state: normalizedState,
    slug,
    region: normalizedState ? `${normalizedState} · destino rural` : "Destino rural",
  };
}

function locationFromFreeText(value: string | null | undefined): DestinationLocation | null {
  const parts = clean(value)
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length < 2) return null;
  return locationFrom(parts[0], parts[1]);
}

function locationForProduct(product: ProductDestinationRow) {
  return locationFrom(product.producer?.city, product.producer?.state);
}

function locationForExperience(experience: ExperienceDestinationRow) {
  return locationFrom(experience.producer?.city, experience.producer?.state) ?? locationFromFreeText(experience.location);
}

function countLabel(count: number, singular: string, plural: string) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function offerLabel(productCount: number, experienceCount: number, producerCount: number) {
  const parts = [
    productCount > 0 ? countLabel(productCount, "produto regional", "produtos regionais") : "",
    experienceCount > 0 ? countLabel(experienceCount, "experiência", "experiências") : "",
    producerCount > 0 ? countLabel(producerCount, "anfitrião local", "anfitriões locais") : "",
  ].filter(Boolean);

  return parts.length ? parts.join(" · ") : "Destino em formação";
}

function automaticDescription(name: string, label: string) {
  return `${name} aparece automaticamente na Seravie Campo porque já tem ${label.toLowerCase()} publicados por anfitriões, produtores ou parceiros locais.`;
}

function automaticHighlights(productCount: number, experienceCount: number, producerCount: number) {
  return [
    productCount > 0 ? countLabel(productCount, "produto regional publicado", "produtos regionais publicados") : "",
    experienceCount > 0 ? countLabel(experienceCount, "experiência disponível", "experiências disponíveis") : "",
    producerCount > 0 ? countLabel(producerCount, "anfitrião/produtor ativo", "anfitriões/produtores ativos") : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function categoryLabel(value: string | null | undefined) {
  return value && value in CATEGORY_LABEL ? CATEGORY_LABEL[value as ProductCategory] : "Produto regional";
}

function unitLabel(value: string | null | undefined) {
  return value && value in UNIT_LABEL ? UNIT_LABEL[value as ProductUnit] : value || "unidade";
}

function experienceCategoryLabel(value: string | null | undefined) {
  return value && value in EXP_CATEGORY_LABEL ? EXP_CATEGORY_LABEL[value as ExperienceCategory] : "Experiência rural";
}

function touchAggregate(aggregate: DestinationAggregate, createdAt: string | null) {
  if (!createdAt) return;
  if (!aggregate.lastCreated || createdAt > aggregate.lastCreated) aggregate.lastCreated = createdAt;
}

function addProducer(aggregate: DestinationAggregate, producer: ProducerRow | null) {
  if (!producer?.id || aggregate.producers.has(producer.id)) return;
  aggregate.producers.set(producer.id, {
    id: producer.id,
    name: producerName(producer),
    role: producer.role || "produtor",
    avatar_url: producer.avatar_url,
    cover_url: producer.cover_url,
    bio: clean(producer.bio),
    location: [producer.city, producer.state].filter(Boolean).join(", "),
    verified: producer.verification_status === "verificado",
  });
}

function getAggregate(map: Map<string, DestinationAggregate>, location: DestinationLocation, fallbackImage: string) {
  const existing = map.get(location.slug);
  if (existing) return existing;

  const aggregate: DestinationAggregate = {
    ...location,
    image: fallbackImage,
    product_count: 0,
    experience_count: 0,
    producers: new Map(),
    products: [],
    experiences: [],
    lastCreated: null,
  };
  map.set(location.slug, aggregate);
  return aggregate;
}

async function fetchDestinationRows(supabase: SupabaseClient) {
  const [productsResult, experiencesResult] = await Promise.all([
    supabase
      .from("products")
      .select(
        `id, name, description, category, price_cents, unit, stock, is_organic, image_url, images, created_at, producer:profiles!products_producer_id_fkey(${PRODUCER_FIELDS})`
      )
      .eq("available", true)
      .eq("archived", false)
      .order("created_at", { ascending: false })
      .limit(240),
    supabase
      .from("experiences")
      .select(
        `id, title, summary, category, price_cents, currency, duration_min, images, location, created_at, producer:profiles!experiences_producer_id_fkey(${PRODUCER_FIELDS})`
      )
      .eq("active", true)
      .eq("archived", false)
      .order("created_at", { ascending: false })
      .limit(240),
  ]);

  return {
    products: (productsResult.data ?? []) as unknown as ProductDestinationRow[],
    experiences: (experiencesResult.data ?? []) as unknown as ExperienceDestinationRow[],
  };
}

function buildAutomaticDestinations(site: SiteContent, products: ProductDestinationRow[], experiences: ExperienceDestinationRow[]) {
  const map = new Map<string, DestinationAggregate>();

  for (const product of products) {
    if (!isSeraviePublisher(product.producer)) continue;
    const location = locationForProduct(product);
    if (!location) continue;

    const aggregate = getAggregate(map, location, firstImage(product.image_url, product.images, product.producer?.cover_url, site.hero_image_url));
    aggregate.product_count += 1;
    aggregate.products.push(product);
    if (!aggregate.image) aggregate.image = firstImage(product.image_url, product.images, product.producer?.cover_url, site.hero_image_url);
    addProducer(aggregate, product.producer);
    touchAggregate(aggregate, product.created_at);
  }

  for (const experience of experiences) {
    if (!isSeraviePublisher(experience.producer)) continue;
    const location = locationForExperience(experience);
    if (!location) continue;

    const aggregate = getAggregate(map, location, firstImage(experience.images, experience.producer?.cover_url, site.hero_image_url));
    aggregate.experience_count += 1;
    aggregate.experiences.push(experience);
    if (!aggregate.image) aggregate.image = firstImage(experience.images, experience.producer?.cover_url, site.hero_image_url);
    addProducer(aggregate, experience.producer);
    touchAggregate(aggregate, experience.created_at);
  }

  return [...map.values()]
    .map((aggregate): PublicDestination => {
      const producer_count = aggregate.producers.size;
      const listing_count = aggregate.product_count + aggregate.experience_count;
      const label = offerLabel(aggregate.product_count, aggregate.experience_count, producer_count);

      return {
        name: aggregate.name,
        region: aggregate.region,
        image: aggregate.image || site.hero_image_url,
        slug: aggregate.slug,
        source: "automatic",
        listing_count,
        product_count: aggregate.product_count,
        experience_count: aggregate.experience_count,
        producer_count,
        city: aggregate.city,
        state: aggregate.state,
        offer_label: label,
        intro: automaticDescription(aggregate.name, label),
        description: automaticDescription(aggregate.name, label),
        highlights: automaticHighlights(aggregate.product_count, aggregate.experience_count, producer_count),
        best_time: "Consulte a sazonalidade com os anfitriões locais.",
        travel_time: "Roteiros flexíveis conforme as ofertas publicadas.",
        cta_label: "Ver ofertas do destino",
        cta_href: "#ofertas",
      };
    })
    .sort((a, b) => b.listing_count - a.listing_count || a.name.localeCompare(b.name, "pt-BR"));
}

function manualDestination(destination: DestinationItem): PublicDestination {
  return {
    ...destination,
    slug: destination.slug || slugify(destination.name),
    source: "cms",
    listing_count: 0,
    product_count: 0,
    experience_count: 0,
    producer_count: 0,
    offer_label: "Curadoria Seravie Campo",
  };
}

function mergeDestinations(site: SiteContent, automatic: PublicDestination[]) {
  const merged = new Map<string, PublicDestination>();

  for (const destination of site.destinations) {
    const manual = manualDestination(destination);
    merged.set(manual.slug || slugify(manual.name), manual);
  }

  for (const destination of automatic) {
    const key = destination.slug || slugify(destination.name);
    const existing = merged.get(key);
    if (!existing) {
      merged.set(key, destination);
      continue;
    }

    merged.set(key, {
      ...existing,
      image: existing.image || destination.image || site.hero_image_url,
      listing_count: destination.listing_count,
      product_count: destination.product_count,
      experience_count: destination.experience_count,
      producer_count: destination.producer_count,
      city: destination.city,
      state: destination.state,
      offer_label: destination.offer_label,
      highlights: existing.highlights || destination.highlights,
      best_time: existing.best_time || destination.best_time,
      travel_time: existing.travel_time || destination.travel_time,
    });
  }

  return [...merged.values()];
}

export async function getPublicDestinations(supabase: SupabaseClient, site: SiteContent): Promise<PublicDestination[]> {
  const { products, experiences } = await fetchDestinationRows(supabase);
  return mergeDestinations(site, buildAutomaticDestinations(site, products, experiences));
}

export async function findPublicDestination(supabase: SupabaseClient, site: SiteContent, slug: string) {
  const destinations = await getPublicDestinations(supabase, site);
  return destinations.find((destination) => (destination.slug || slugify(destination.name)) === slug) ?? null;
}

function productToListing(product: ProductDestinationRow, destinationImage: string): DestinationProduct {
  const unit = unitLabel(product.unit);

  return {
    id: product.id,
    name: product.name,
    description: clean(product.description),
    category_label: categoryLabel(product.category),
    price_label: `${formatBRL(product.price_cents ?? 0)} /${unit}`,
    image: firstImage(product.image_url, product.images, product.producer?.cover_url, destinationImage),
    producer_name: producerName(product.producer),
    location: [product.producer?.city, product.producer?.state].filter(Boolean).join(", "),
    is_organic: Boolean(product.is_organic),
  };
}

function experienceToListing(experience: ExperienceDestinationRow, destinationImage: string): DestinationExperience {
  return {
    id: experience.id,
    title: experience.title,
    summary: clean(experience.summary),
    category_label: experienceCategoryLabel(experience.category),
    price_label: formatExpPrice(experience.price_cents ?? 0, experience.currency || "BRL"),
    duration_label: durationLabel(experience.duration_min ?? 0),
    image: firstImage(experience.images, experience.producer?.cover_url, destinationImage),
    producer_name: producerName(experience.producer),
    location: experience.location || [experience.producer?.city, experience.producer?.state].filter(Boolean).join(", "),
  };
}

export async function getDestinationListings(
  supabase: SupabaseClient,
  site: SiteContent,
  destination: PublicDestination
): Promise<DestinationListings> {
  const slug = destination.slug || slugify(destination.name);
  const { products, experiences } = await fetchDestinationRows(supabase);
  const producerMap = new Map<string, DestinationProducer>();

  const matchingProducts = products.filter((product) => {
    if (!isSeraviePublisher(product.producer)) return false;
    return locationForProduct(product)?.slug === slug;
  });

  const matchingExperiences = experiences.filter((experience) => {
    if (!isSeraviePublisher(experience.producer)) return false;
    return locationForExperience(experience)?.slug === slug;
  });

  for (const product of matchingProducts) {
    const aggregate = getAggregate(new Map(), locationForProduct(product) ?? locationFrom(destination.name, destination.state)!, destination.image);
    addProducer(aggregate, product.producer);
    for (const producer of aggregate.producers.values()) producerMap.set(producer.id, producer);
  }

  for (const experience of matchingExperiences) {
    const aggregate = getAggregate(new Map(), locationForExperience(experience) ?? locationFrom(destination.name, destination.state)!, destination.image);
    addProducer(aggregate, experience.producer);
    for (const producer of aggregate.producers.values()) producerMap.set(producer.id, producer);
  }

  return {
    products: matchingProducts.slice(0, 8).map((product) => productToListing(product, destination.image || site.hero_image_url)),
    experiences: matchingExperiences.slice(0, 6).map((experience) => experienceToListing(experience, destination.image || site.hero_image_url)),
    producers: [...producerMap.values()].slice(0, 6),
  };
}
