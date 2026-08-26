import { XMLParser } from 'fast-xml-parser';

export type NewsCategory = 'breaking' | 'stem' | 'sports' | 'medicine';

export type Headline = {
  id: string;
  title: string;
  url: string;
  publishedAt: string;
};

const FEED_URLS: Record<NewsCategory, string> = {
  breaking: 'https://feeds.bbci.co.uk/news/rss.xml',
  stem: 'https://feeds.bbci.co.uk/news/science_and_environment/rss.xml',
  sports: 'https://feeds.bbci.co.uk/sport/rss.xml',
  medicine: 'https://feeds.bbci.co.uk/news/health/rss.xml',
};

const parser = new XMLParser({ ignoreAttributes: true });

type RssItem = {
  title?: string;
  link?: string;
  pubDate?: string;
  guid?: string | { '#text'?: string };
};

function extractGuid(item: RssItem): string {
  if (typeof item.guid === 'string') return item.guid;
  if (item.guid && typeof item.guid === 'object') return item.guid['#text'] ?? '';
  return item.link ?? item.title ?? '';
}

export async function fetchHeadlines(category: NewsCategory, limit = 8): Promise<Headline[]> {
  const res = await fetch(FEED_URLS[category], { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`News feed error (${res.status})`);
  }
  const xml = await res.text();
  const parsed = parser.parse(xml);
  const rawItems = parsed?.rss?.channel?.item;
  const items: RssItem[] = Array.isArray(rawItems) ? rawItems : rawItems ? [rawItems] : [];

  return items.slice(0, limit).map((item) => ({
    id: extractGuid(item),
    title: item.title ?? '(Untitled)',
    url: item.link ?? '',
    publishedAt: item.pubDate ?? '',
  }));
}
