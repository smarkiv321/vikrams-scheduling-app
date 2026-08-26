export type InternshipPosting = {
  id: string;
  title: string;
  company: string;
  location: string;
  url: string;
  postedAt: string;
};

const LISTINGS_URL =
  'https://raw.githubusercontent.com/SimplifyJobs/Summer2026-Internships/dev/.github/scripts/listings.json';

const RELEVANT_CATEGORIES = new Set(['Software', 'Software Engineering', 'Quant', 'Quantitative Finance']);

type RawListing = {
  id: string;
  company_name: string;
  title: string;
  category?: string;
  active?: boolean;
  date_posted?: number;
  url?: string;
  locations?: string[];
};

export async function fetchInternships(): Promise<InternshipPosting[]> {
  const res = await fetch(LISTINGS_URL, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`Internship listings error (${res.status})`);
  }
  const listings = (await res.json()) as RawListing[];

  const now = new Date();
  const cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).getTime() / 1000;

  return listings
    .filter((listing) => {
      if (!listing.active) return false;
      if (!listing.category || !RELEVANT_CATEGORIES.has(listing.category)) return false;
      if (!listing.date_posted || listing.date_posted < cutoff) return false;
      return true;
    })
    .map((listing) => ({
      id: listing.id,
      title: listing.title,
      company: listing.company_name,
      location: listing.locations?.join(', ') || 'Unspecified',
      url: listing.url ?? '',
      postedAt: new Date((listing.date_posted ?? 0) * 1000).toISOString(),
    }))
    .sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime());
}
